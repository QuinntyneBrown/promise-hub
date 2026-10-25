using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Households;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Enrollment;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Enrollment;

/// <summary>
/// The guardian's side of enrollment (L2-013): verify the typed contact with a code, see last season's household when it is
/// a returning family, fill in the household and children, and submit with the season consent. A submission waits for
/// staff review, or is waitlisted with a position when the program is full.
/// </summary>
public sealed class GuardianEnrollmentHandler(
    IPromiseHubDb db,
    ITenantContext tenant,
    EnrollmentLink link,
    ISmsSender sms,
    IEmailSender email,
    IAuditWriter audit,
    TimeProvider clock)
{
    public async Task<GuardianResult> PageAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (await link.ResolveAsync(slug, cancellationToken) is not var (program, organization))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        return GuardianResult.Of(GuardianOutcome.Ok, new EnrollmentPageDto(program.Name, organization.Name, organization.Phone, program.EnrollmentOpen,
            program.Schedule, program.Ages, program.StartsOn));
    }

    public async Task<GuardianResult> RequestCodeAsync(string slug, EnrollmentCodeRequest request, CancellationToken cancellationToken = default)
    {
        if (await link.ResolveAsync(slug, cancellationToken) is not var (program, organization))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        if (!program.EnrollmentOpen)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict);
        }
        if (EnrollmentContact.Normalize(request.Contact) is not { } contact)
        {
            return GuardianResult.Invalid("contact", "Enter a mobile number or an email.");
        }
        var session = await db.EnrollmentSessions.FirstOrDefaultAsync(s => s.ProgramId == program.Id && s.Contact == contact && s.SubmittedAt == null, cancellationToken);
        if (session is null)
        {
            session = new EnrollmentSession(Guid.NewGuid(), tenant.OrganizationId, program.Id, contact);
            db.EnrollmentSessions.Add(session);
        }
        var code = GuardianTokens.NewCode();
        session.NewCode(GuardianTokens.Hash($"{session.Id}:{code}"), clock.GetUtcNow().AddMinutes(10));
        var text = $"Your {organization.Name} code is {code}. It expires in 10 minutes.";
        if (EnrollmentContact.IsPhone(contact))
        {
            await sms.SendAsync(EnrollmentContact.Display(contact), text, cancellationToken);
        }
        else
        {
            await email.SendAsync(contact, $"Your {organization.Name} code", text, cancellationToken);
        }
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    public async Task<GuardianResult> VerifyAsync(string slug, EnrollmentVerifyRequest request, CancellationToken cancellationToken = default)
    {
        if (await link.ResolveAsync(slug, cancellationToken) is not var (program, _))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        var contact = EnrollmentContact.Normalize(request.Contact);
        var session = contact is null ? null
            : await db.EnrollmentSessions.FirstOrDefaultAsync(s => s.ProgramId == program.Id && s.Contact == contact && s.SubmittedAt == null, cancellationToken);
        var now = clock.GetUtcNow();
        if (session is null)
        {
            return GuardianResult.Invalid("code", "That code didn’t work. Send a new one.");
        }
        if (session.IsLocked(now))
        {
            return GuardianResult.Of(GuardianOutcome.Locked);
        }
        if (session.CodeHash != GuardianTokens.Hash($"{session.Id}:{request.Code?.Trim()}") || session.CodeExpiresAt <= now)
        {
            if (session.WrongCode(now))
            {
                audit.Record(new AuditEvent(AuditAction.AccessDenied, "Enrollment", session.Id, "Three wrong codes: enrollment locked for 15 minutes"));
            }
            await db.SaveChangesAsync(cancellationToken);
            return GuardianResult.Invalid("code", "That code didn’t work. Check the latest text or email.");
        }
        var guardians = await db.Guardians.AsNoTracking().ToListAsync(cancellationToken);
        var returning = guardians.FirstOrDefault(g => EnrollmentContact.IsPhone(contact!)
            ? g.Mobile is not null && ContactMask.Digits(g.Mobile) == contact
            : string.Equals(g.Email, contact, StringComparison.OrdinalIgnoreCase));
        var token = GuardianTokens.New();
        session.Verified(GuardianTokens.Hash(token), returning?.HouseholdId, now);
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done, token);
    }

    public async Task<GuardianResult> DraftAsync(string slug, string? device, CancellationToken cancellationToken = default)
    {
        var (problem, session, program) = await SessionAsync(slug, device, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        if (session!.Draft is { } saved)
        {
            var draft = JsonSerializer.Deserialize<EnrollmentDraft>(saved)!;
            return GuardianResult.Of(GuardianOutcome.Ok, new EnrollmentDraftDto(session.HouseholdId is not null, GuardianLanguage.Code(draft.Household.Language ?? "English"), program!.Name, draft.Household, draft.Children));
        }
        if (session.HouseholdId is { } householdId)
        {
            var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == householdId, cancellationToken);
            var guardian = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == householdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstAsync(cancellationToken);
            var children = await db.Children.AsNoTracking().Where(c => c.HouseholdId == householdId).OrderBy(c => c.FirstName).ToListAsync(cancellationToken);
            return GuardianResult.Of(GuardianOutcome.Ok, new EnrollmentDraftDto(true, GuardianLanguage.Code(household.Language), program!.Name,
                new EnrollmentHouseholdDraft(guardian.Name, guardian.Mobile, guardian.Email, household.Language),
                [.. children.Select(c => new EnrollmentChildDraft(c.Id, c.FirstName, c.LastName, c.DateOfBirth, c.School, c.Allergies, c.Medication, true))]));
        }
        var phone = EnrollmentContact.IsPhone(session.Contact) ? EnrollmentContact.Display(session.Contact) : null;
        var mail = EnrollmentContact.IsPhone(session.Contact) ? null : session.Contact;
        return GuardianResult.Of(GuardianOutcome.Ok, new EnrollmentDraftDto(false, "en", program!.Name, new EnrollmentHouseholdDraft(null, phone, mail, "English"), []));
    }

    public async Task<GuardianResult> SaveAsync(string slug, string? device, EnrollmentDraft draft, CancellationToken cancellationToken = default)
    {
        var (problem, session, _) = await SessionAsync(slug, device, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var errors = Validate(draft);
        if (errors.Count > 0)
        {
            return new GuardianResult(GuardianOutcome.Invalid, Errors: errors);
        }
        session!.SaveDraft(JsonSerializer.Serialize(draft));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    public async Task<GuardianResult> SubmitAsync(string slug, string? device, EnrollmentSubmitRequest request, CancellationToken cancellationToken = default)
    {
        var (problem, session, program) = await SessionAsync(slug, device, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        if (session!.SubmittedAt is not null || !program!.EnrollmentOpen || session.Draft is null)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict);
        }
        if (!request.Consent)
        {
            return GuardianResult.Invalid("consent", "Agree to the season consent to submit.");
        }
        var draft = JsonSerializer.Deserialize<EnrollmentDraft>(session.Draft)!;
        var now = clock.GetUtcNow();
        var language = HouseholdRules.Languages.Contains(draft.Household.Language ?? string.Empty) ? draft.Household.Language! : "English";
        var guardianName = draft.Household.GuardianName!.Trim();
        Household household;
        if (session.HouseholdId is { } existing)
        {
            household = await db.Households.SingleAsync(h => h.Id == existing, cancellationToken);
        }
        else
        {
            var (_, last) = PersonName.Split(guardianName);
            household = new Household(Guid.NewGuid(), tenant.OrganizationId, string.IsNullOrEmpty(last) ? guardianName : last, language);
            db.Households.Add(household);
            db.Guardians.Add(new Domain.Households.Guardian(Guid.NewGuid(), tenant.OrganizationId, household.Id, guardianName, "Guardian",
                Clean(draft.Household.Mobile), Clean(draft.Household.Email), language, isPrimary: true, canPickUp: true, canSign: true));
        }
        var accepted = await db.Enrollments.CountAsync(e => e.ProgramId == program.Id && e.EndedAt == null, cancellationToken);
        var waitlisted = await db.EnrollmentRequests.CountAsync(r => r.ProgramId == program.Id && r.Status == EnrollmentRequestStatus.Waitlisted, cancellationToken);
        var existingChildren = await db.Children.Where(c => c.HouseholdId == household.Id).ToListAsync(cancellationToken);
        int? firstPosition = null;
        var count = 0;
        foreach (var c in draft.Children.Where(c => c.Enroll))
        {
            var child = c.Id is { } id ? existingChildren.FirstOrDefault(x => x.Id == id) : null;
            if (child is null)
            {
                child = new Child(Guid.NewGuid(), tenant.OrganizationId, household.Id, c.FirstName!.Trim(), c.LastName!.Trim(), c.DateOfBirth, Clean(c.School));
                db.Children.Add(child);
            }
            else
            {
                child.UpdateDetails(c.FirstName!.Trim(), c.LastName!.Trim(), c.DateOfBirth, Clean(c.School));
            }
            if (Clean(c.Allergies) is not null || Clean(c.Medication) is not null)
            {
                child.UpdateMedical(new MedicalDetails(Clean(c.Allergies), Clean(c.Medication), child.Conditions, child.Doctor, child.RedAlert, child.AlertInstruction), guardianName, now);
            }
            var full = accepted >= program.Capacity;
            int? position = full ? ++waitlisted : null;
            firstPosition ??= position;
            db.EnrollmentRequests.Add(new EnrollmentRequest(Guid.NewGuid(), tenant.OrganizationId, program.Id, child.Id, household.Id,
                full ? EnrollmentRequestStatus.Waitlisted : EnrollmentRequestStatus.WaitingReview, position, guardianName, now));
            count++;
        }
        session.Submitted(household.Id, now);
        var status = firstPosition is null ? "WaitingReview" : "Waitlisted";
        audit.Record(new AuditEvent(AuditAction.Created, "Enrollment", session.Id, $"{program.Name} · {count} children from {guardianName} · {status}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new EnrollmentSubmitDto(status, firstPosition, count, program.Name));
    }

    private static Dictionary<string, string> Validate(EnrollmentDraft draft)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(draft.Household?.GuardianName))
        {
            errors["guardianName"] = "Enter your full name.";
        }
        if (string.IsNullOrWhiteSpace(draft.Household?.Mobile) && string.IsNullOrWhiteSpace(draft.Household?.Email))
        {
            errors["mobile"] = "Add a mobile number or an email.";
        }
        var children = draft.Children ?? [];
        if (!children.Any(c => c.Enroll))
        {
            errors["children"] = "Add at least one child.";
        }
        for (var i = 0; i < children.Count; i++)
        {
            var c = children[i];
            if (!c.Enroll)
            {
                continue;
            }
            if (string.IsNullOrWhiteSpace(c.FirstName) || string.IsNullOrWhiteSpace(c.LastName))
            {
                errors[$"children[{i}].name"] = "Enter the child’s first and last name.";
            }
            if (c.DateOfBirth is null)
            {
                errors[$"children[{i}].dateOfBirth"] = "Enter the child’s date of birth.";
            }
        }
        return errors;
    }

    private async Task<(GuardianResult? Problem, EnrollmentSession? Session, Domain.Programs.Program? Program)> SessionAsync(string slug, string? device, CancellationToken cancellationToken)
    {
        if (await link.ResolveAsync(slug, cancellationToken) is not var (program, _))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null, null);
        }
        var session = await link.SessionAsync(program.Id, device, cancellationToken);
        return session is null
            ? (GuardianResult.Of(GuardianOutcome.VerificationRequired, new { code = "verification-required" }), null, null)
            : (null, session, program);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
