using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The guardian invitation (L2-139): the platform wording previewed in each language the tenant's households use, with the SMS segment
/// count, and the sender name, the one part the organization edits. The previews use sample names; no household is read beyond its language.
/// </summary>
public sealed class LearningBondInvitationHandler(IPromiseHubDb db, ITenantContext tenant, LearningBondSettingsHandler settings, IAuditWriter audit, TimeProvider clock)
{
    public async Task<LearningBondInvitationDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => new { o.Name, o.City }).SingleAsync(cancellationToken);
        var sender = await SenderNameAsync(organization.Name, cancellationToken);
        var languages = await LanguagesAsync(cancellationToken);
        return new LearningBondInvitationDto(sender, [.. languages.Select(code =>
        {
            var sms = LearningBondTexts.Sms(code, sender, LearningBondTexts.SampleChild, LearningBondTexts.SampleLink);
            return new LearningBondInvitationLanguageDto(code, LearningBondTexts.LanguageName(code), sms, sms.Length, SmsSegments.Count(sms),
                LearningBondTexts.EmailTitle(code, LearningBondTexts.SampleChild), LearningBondTexts.EmailText(code, LearningBondTexts.SampleGuardian),
                LearningBondTexts.EmailAction(code), LearningBondTexts.EmailFooter(code, sender, organization.Name, organization.City));
        })]);
    }

    public async Task<Result> SaveAsync(SaveInvitationRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.SenderName?.Trim() ?? string.Empty;
        if (!SenderNameRule.IsValid(name))
        {
            return Result.Invalid(new Dictionary<string, string> { ["senderName"] = SenderNameRule.Message });
        }
        var row = await settings.RowAsync(cancellationToken);
        if (row.SenderName != name)
        {
            row.ChangeSenderName(name, clock.GetUtcNow());
            audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSettings), row.Id, "Learning Bond settings changed: SenderName"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>The saved sender name, or the organization's name cut to 30 characters (criterion 5).</summary>
    public async Task<string> SenderNameAsync(string organization, CancellationToken cancellationToken = default) =>
        await db.LearningBondSettings.AsNoTracking().Select(s => s.SenderName).FirstOrDefaultAsync(cancellationToken) ?? SenderNameRule.Default(organization);

    /// <summary>The languages the tenant's households use, as codes in English, Spanish, French order; English when there are none.</summary>
    public async Task<IReadOnlyList<string>> LanguagesAsync(CancellationToken cancellationToken = default)
    {
        var used = (await db.Households.AsNoTracking().Select(h => h.Language).Distinct().ToListAsync(cancellationToken)).Select(GuardianLanguage.Code).ToHashSet();
        var codes = LearningBondTexts.Languages.Where(used.Contains).ToList();
        return codes.Count > 0 ? codes : ["en"];
    }
}
