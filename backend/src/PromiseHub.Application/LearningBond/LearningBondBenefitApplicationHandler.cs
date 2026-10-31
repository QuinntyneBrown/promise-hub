using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One benefit's application (L2-156): prepared from what the household already gave, its document kept encrypted until it goes, edited for
/// this application only, and sent on its own: Submit once through the program's channel with the review's version, or, for a form the
/// guardian sends, the filled PDF and Mark as sent. There is no Submit all; nothing leaves before the guardian's own act.
/// </summary>
public sealed class LearningBondBenefitApplicationHandler(IPromiseHubDb db, LearningBondBenefitsAccess access, ILearningBondCipher cipher, IFileStore files,
    IBenefitChannel channel, LearningBondDatePlanner planner, IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> PrepareAsync(GuardianRequest request, string benefitKey, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await access.ConsentedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (BenefitCatalogue.Named(benefitKey) is not { } entry)
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        if (await access.AnswersAsync(scope!.Household.Id, cancellationToken) is null)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "intake-incomplete" });
        }
        var application = await OpenAsync(scope, entry, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope, application, entry, cancellationToken));
    }

    /// <summary>The document a program needs first (L2-156 criterion 5): a PDF, JPEG or PNG up to 10 MB, kept encrypted with this application.</summary>
    public async Task<GuardianResult> UploadDocumentAsync(GuardianRequest request, string benefitKey, string fileName, string? contentType, long length, Stream content,
        CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await access.ConsentedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (BenefitCatalogue.Named(benefitKey) is not { Rule.Document: { } documentName } entry)
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        var name = Path.GetFileName(fileName ?? string.Empty);
        var type = Path.GetExtension(name).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => null,
        };
        if (type is null || !string.Equals(type, contentType, StringComparison.OrdinalIgnoreCase))
        {
            return GuardianResult.Invalid("file", LearningBondDocumentHandler.FileMessage);
        }
        if (length > LearningBondDocument.MaximumBytes)
        {
            return GuardianResult.Invalid("file", $"That file is {Math.Ceiling(length / (1024d * 1024d))} MB. {LearningBondDocumentHandler.FileMessage}");
        }
        var application = await OpenAsync(scope!, entry, cancellationToken);
        if (!application.Editable)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "sent" });
        }
        var now = clock.GetUtcNow();
        var document = await db.LearningBondDocuments.FirstOrDefaultAsync(d => d.ApplicationId == application.Id, cancellationToken);
        if (document is null)
        {
            document = new LearningBondDocument(Guid.NewGuid(), application.OrganizationId, application.Id, documentName, now);
            db.LearningBondDocuments.Add(document);
        }
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        var key = $"learning-bond/{application.OrganizationId}/benefit-documents/{document.Id}";
        using (var encrypted = new MemoryStream(cipher.EncryptDocument(buffer.ToArray())))
        {
            await files.SaveAsync(key, encrypted, cancellationToken);
        }
        document.Upload(name.Length > 200 ? name[^200..] : name, type, key, now);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondDocument), document.Id, $"Benefit document uploaded for {entry.Name}: {documentName}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new { id = document.Id, fileName = document.FileName });
    }

    public async Task<GuardianResult> EditFieldAsync(GuardianRequest request, Guid applicationId, string field, LearningBondFieldValueRequest change,
        CancellationToken cancellationToken = default)
    {
        var (gate, scope, application, entry) = await OwnAsync(request, applicationId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (!application!.Editable)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "sent" });
        }
        var value = (change.Value ?? string.Empty).Trim();
        var now = clock.GetUtcNow();
        switch (field)
        {
            case "phone" when ContactMask.Digits(value) is { Length: 10 } digits:
                application.ChangePhone($"{digits[..3]}-{digits[3..6]}-{digits[6..]}", now);
                break;
            case "phone":
                return GuardianResult.Invalid("value", LearningBondApplicationHandler.PhoneMessage);
            case "email" when EmailAddressRule.IsValid(value):
                application.ChangeEmail(value, now);
                break;
            case "email":
                return GuardianResult.Invalid("value", LearningBondApplicationHandler.EmailMessage);
            case "address" when value.Length is >= 10 and <= LearningBondApplication.MaximumAddress:
                application.ChangeAddress(value, now);
                break;
            case "address":
                return GuardianResult.Invalid("value", LearningBondApplicationHandler.AddressMessage);
            default:
                return GuardianResult.Invalid("value", "This field can’t be changed here.");
        }
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondBenefitApplication), application.Id, $"Benefit application for {entry!.Name}: {field} changed"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope!, application, entry, cancellationToken));
    }

    public async Task<GuardianResult> SubmitAsync(GuardianRequest request, Guid applicationId, SubmitLearningBondApplicationRequest submit,
        CancellationToken cancellationToken = default)
    {
        var (gate, scope, application, entry) = await OwnAsync(request, applicationId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (application!.Status == LearningBondBenefitApplicationStatus.Submitted)
        {
            return Accepted(application);
        }
        if (entry!.Channel != BenefitChannel.Electronic || application.Status == LearningBondBenefitApplicationStatus.MarkedSent)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "form" });
        }
        if (submit.ReviewVersion != application.ReviewVersion)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "stale-review" });
        }
        if (application.Status != LearningBondBenefitApplicationStatus.ReadyToSubmit)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "incomplete" });
        }
        var intake = await db.LearningBondIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.HouseholdId == scope!.Household.Id, cancellationToken);
        if (intake?.GuardianSin is not { IsDestroyed: false } sin || await access.AnswersAsync(scope!.Household.Id, cancellationToken) is not { } answers)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "incomplete" });
        }
        if (!cipher.IsAvailable)
        {
            return GuardianResult.Of(GuardianOutcome.Unavailable);
        }
        var key = application.BeginSubmission();
        await db.SaveChangesAsync(cancellationToken);
        var review = await DtoAsync(scope, application, entry, cancellationToken);
        var result = await channel.SubmitAsync(new BenefitSubmission(key, entry.Key, entry.Name, review.Fields.ApplicantName, cipher.Decrypt(sin), answers.MaritalStatus,
            answers.HouseholdSize, [.. review.Fields.Children.Split(", ")], application.Address!, application.Phone, application.Email, scope.Household.Language), cancellationToken);
        if (!result.Sent)
        {
            return GuardianResult.Of(GuardianOutcome.NotSent);
        }
        application.MarkSubmitted(result.Reference, clock.GetUtcNow());
        // Never a SIN in the audit (L2-159, L2-161).
        audit.Record(new AuditEvent(AuditAction.Submitted, nameof(LearningBondBenefitApplication), application.Id, $"Benefit application submitted: {entry.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        await planner.SyncAsync(application.OrganizationId, application.HouseholdId, scope.Organization.TimeZone, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return Accepted(application);
    }

    /// <summary>The filled form for a program the guardian sends themselves; the SIN box is left for them (L2-156 criterion 2, L2-159).</summary>
    public async Task<(GuardianResult? Gate, byte[]? Pdf, string? FileName)> FormAsync(GuardianRequest request, Guid applicationId, CancellationToken cancellationToken = default)
    {
        var (gate, scope, application, entry) = await OwnAsync(request, applicationId, cancellationToken);
        if (gate is not null)
        {
            return (gate, null, null);
        }
        if (entry!.Channel != BenefitChannel.Form)
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null, null);
        }
        var review = await DtoAsync(scope!, application!, entry, cancellationToken);
        var f = review.Fields;
        string[] lines =
        [
            $"Applicant: {f.ApplicantName}",
            $"Social insurance number: ___ ___ ___ (yours ends in {f.ApplicantSin ?? "..."})",
            $"Marital status: {f.MaritalStatus}",
            $"People in the household: {f.HouseholdSize}",
            $"Children: {f.Children}",
            $"Address: {f.Address ?? "_______________________________"}",
            $"Phone: {f.Phone ?? "____________"}",
            $"Email: {f.Email ?? "____________"}",
            string.Empty,
            review.DocumentFile is { } file ? $"Attach: {entry.Rule.Document} ({file})" : $"Attach: {entry.Rule.Document ?? "nothing more"}",
            $"Send to: {entry.SendTo}",
            string.Empty,
            "Signature: ______________________   Date: ____________",
        ];
        audit.Record(new AuditEvent(AuditAction.Exported, nameof(LearningBondBenefitApplication), application!.Id, $"Benefit form downloaded: {entry.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return (null, LearningBondFormPdf.Render($"{entry.Name} application", lines), $"{entry.Key}-application.pdf");
    }

    /// <summary>The guardian sent the form themselves and says so (L2-156 criterion 2).</summary>
    public async Task<GuardianResult> MarkSentAsync(GuardianRequest request, Guid applicationId, CancellationToken cancellationToken = default)
    {
        var (gate, scope, application, entry) = await OwnAsync(request, applicationId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (entry!.Channel != BenefitChannel.Form)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "electronic" });
        }
        if (application!.Status != LearningBondBenefitApplicationStatus.MarkedSent)
        {
            application.MarkSentByGuardian(clock.GetUtcNow());
            audit.Record(new AuditEvent(AuditAction.Sent, nameof(LearningBondBenefitApplication), application.Id, $"Benefit form marked sent by the guardian: {entry.Name}"));
            await db.SaveChangesAsync(cancellationToken);
            await planner.SyncAsync(application.OrganizationId, application.HouseholdId, scope!.Organization.TimeZone, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    private static GuardianResult Accepted(LearningBondBenefitApplication application) =>
        GuardianResult.Of(GuardianOutcome.Accepted, new { id = application.Id, status = application.Status.ToString() });

    private async Task<LearningBondBenefitApplication> OpenAsync(GuardianScope scope, BenefitCatalogueEntry entry, CancellationToken cancellationToken)
    {
        var application = await db.LearningBondBenefitApplications.FirstOrDefaultAsync(a => a.HouseholdId == scope.Household.Id && a.BenefitKey == entry.Key, cancellationToken);
        if (application is not null)
        {
            return application;
        }
        // Contact details reuse what the household gave for its Learning Bond application, or its primary guardian's.
        var lastAddress = (await db.LearningBondApplications.AsNoTracking().Where(a => a.HouseholdId == scope.Household.Id && a.Address != null).ToListAsync(cancellationToken))
            .OrderByDescending(a => a.UpdatedAt).FirstOrDefault();
        var guardian = (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken))
            .OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture).FirstOrDefault();
        application = new LearningBondBenefitApplication(Guid.NewGuid(), scope.Household.OrganizationId, scope.Household.Id, entry.Key, entry.RuleVersion, lastAddress?.Address,
            lastAddress?.Phone ?? guardian?.Mobile, lastAddress?.Email ?? (guardian?.EmailBounced == false ? guardian.Email : null), clock.GetUtcNow());
        db.LearningBondBenefitApplications.Add(application);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondBenefitApplication), application.Id, $"Benefit application prepared: {entry.Name}"));
        return application;
    }

    private async Task<(GuardianResult? Gate, GuardianScope? Scope, LearningBondBenefitApplication? Application, BenefitCatalogueEntry? Entry)> OwnAsync(
        GuardianRequest request, Guid applicationId, CancellationToken cancellationToken)
    {
        var (gate, scope) = await access.ConsentedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return (gate, null, null, null);
        }
        var application = await db.LearningBondBenefitApplications.FirstOrDefaultAsync(a => a.Id == applicationId && a.HouseholdId == scope!.Household.Id, cancellationToken);
        if (application is null || BenefitCatalogue.Named(application.BenefitKey) is not { } entry)
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null, null, null);
        }
        return (null, scope, application, entry);
    }

    private async Task<BenefitReviewDto> DtoAsync(GuardianScope scope, LearningBondBenefitApplication application, BenefitCatalogueEntry entry,
        CancellationToken cancellationToken)
    {
        var answers = await access.AnswersAsync(scope.Household.Id, cancellationToken);
        var children = (await access.ChildrenAsync(scope, cancellationToken))
            .Where(c => answers?.Custody.GetValueOrDefault(c.Id) is null or "Me" or "Shared").ToList();
        var intake = await db.LearningBondIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.HouseholdId == scope.Household.Id, cancellationToken);
        var guardian = (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken))
            .OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture).FirstOrDefault();
        var file = await db.LearningBondDocuments.AsNoTracking().Where(d => d.ApplicationId == application.Id).Select(d => d.FileName).FirstOrDefaultAsync(cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        var perChild = entry.Rule.PerChild;
        int? amount = perChild is null || children.Count == 0 ? null : children.Sum(c => perChild(c.Age ?? 0));
        return new BenefitReviewDto(application.Id, code, scope.Organization.Name, AgentFallbackCopy.BenefitReview(code, entry.Channel == BenefitChannel.Form, entry.Name),
            entry.Key, entry.Name, entry.Channel.ToString(), application.Status.ToString(), application.ReviewVersion, amount, file, entry.SendTo,
            new BenefitReviewFieldsDto(guardian?.Name ?? string.Empty, intake?.GuardianSin is { IsDestroyed: false } ? intake.GuardianSinLast3 : null,
                answers?.MaritalStatus ?? string.Empty, answers?.HouseholdSize.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty,
                string.Join(", ", children.Select(c => c.Born is { } born ? $"{c.FirstName} ({born:yyyy-MM-dd})" : c.FirstName)), application.Address, application.Phone,
                application.Email, answers?.CcbNow switch { "Yes" => "Receiving", "No" => "Not receiving", _ => "Not sure" }, entry.Name));
    }
}
