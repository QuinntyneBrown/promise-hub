using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Queues one Learning Bond invitation per household through Messages (L2-140, ADR 0079): in the household's language, naming each eligible
/// child, with the household's own link; by text to each guardian with a mobile number and by email to guardians with an email only. A
/// household invited in the last 7 days is skipped. The invitation row is written with its message, so the caller's one save never sends
/// twice.
/// </summary>
public sealed class LearningBondInvitationSender(IPromiseHubDb db, ITenantContext tenant, MessageWriter writer, GuardianLinkIssuer links, TimeProvider clock)
{
    /// <summary>Queues the invitations and answers the households invited now; the caller saves.</summary>
    public async Task<IReadOnlyList<Guid>> QueueAsync(IReadOnlyList<LearningBondCoveredHousehold> households, LearningBondLaunchMode how,
        CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var ids = households.Select(h => h.HouseholdId).ToList();
        var since = now - LearningBondInvitation.Interval;
        var recent = (await db.LearningBondInvitations.AsNoTracking().Where(i => ids.Contains(i.HouseholdId)).Select(i => new { i.HouseholdId, i.SentAt })
            .ToListAsync(cancellationToken)).Where(i => i.SentAt > since).Select(i => i.HouseholdId).ToHashSet();
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var sender = await db.LearningBondSettings.AsNoTracking().Select(s => s.SenderName).FirstOrDefaultAsync(cancellationToken)
            ?? SenderNameRule.Default(organization.Name);
        var names = await db.Households.AsNoTracking().Where(h => ids.Contains(h.Id)).ToDictionaryAsync(h => h.Id, cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        var invited = new List<Guid>();
        foreach (var household in households.Where(h => !recent.Contains(h.HouseholdId) && names.ContainsKey(h.HouseholdId)))
        {
            var code = GuardianLanguage.Code(names[household.HouseholdId].Language);
            var recipients = guardians.Where(g => g.HouseholdId == household.HouseholdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture)
                .Select(g => Recipient(household.HouseholdId, names[household.HouseholdId].Name, g)).OfType<Recipient>().ToList();
            if (recipients.Count == 0)
            {
                continue;
            }
            var link = links.IssueLearningBond(household.HouseholdId);
            var title = LearningBondTexts.EmailTitle(code, household.Children);
            var sms = LearningBondTexts.Sms(code, sender, household.Children, link);
            var message = writer.Queue(MessageSource.LearningBond, title, sms, ChannelChoice.TextWithEmailFallback,
                new Audience(names[household.HouseholdId].Name, recipients), new AudienceRequest(null, null, null, sms, ChannelChoice.TextWithEmailFallback),
                r => r.Channel == Channel.Sms ? sms : Email(code, r.Guardian, link, sender, organization.Name, organization.City));
            db.LearningBondInvitations.Add(new LearningBondInvitation(Guid.NewGuid(), tenant.OrganizationId, household.HouseholdId, message.Id, how, now));
            invited.Add(household.HouseholdId);
        }
        return invited;
    }

    // A guardian with a mobile number is texted, with their working email as the fallback; one with only a working email is emailed.
    private static Recipient? Recipient(Guid householdId, string household, Domain.Households.Guardian g)
    {
        var email = string.IsNullOrWhiteSpace(g.Email) || g.EmailBounced ? null : g.Email;
        if (!string.IsNullOrWhiteSpace(g.Mobile))
        {
            return new Recipient(householdId, household, g.Name, g.Language, Channel.Sms, g.Mobile, email, null);
        }
        return email is null ? null : new Recipient(householdId, household, g.Name, g.Language, Channel.Email, email, null, null);
    }

    private static string Email(string code, string? guardian, string link, string sender, string organization, string? city) =>
        $"{LearningBondTexts.EmailText(code, FirstName(guardian))}\n\n{LearningBondTexts.EmailAction(code)}: {link}\n\n{LearningBondTexts.EmailFooter(code, sender, organization, city)}";

    private static string FirstName(string? name) => name?.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;
}
