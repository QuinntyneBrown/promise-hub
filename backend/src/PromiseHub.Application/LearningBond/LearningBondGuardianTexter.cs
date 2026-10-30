using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Queues one Learning Bond text to a household's guardians through Messages (L2-150, L2-151), so the send job applies the SMS cap, the email
/// fallback and suspension. Only fixed wording with first names, amounts and links is ever sent; never a SIN.
/// </summary>
public sealed class LearningBondGuardianTexter(IPromiseHubDb db, MessageWriter writer)
{
    /// <summary>False when no guardian of the household can be reached; the caller saves.</summary>
    public async Task<bool> QueueAsync(Guid householdId, string title, string text, CancellationToken cancellationToken = default)
    {
        var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == householdId, cancellationToken);
        var recipients = (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == householdId).ToListAsync(cancellationToken))
            .OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture)
            .Select(g =>
            {
                var email = string.IsNullOrWhiteSpace(g.Email) || g.EmailBounced ? null : g.Email;
                return !string.IsNullOrWhiteSpace(g.Mobile)
                    ? new Recipient(householdId, household.Name, g.Name, g.Language, Channel.Sms, g.Mobile, email, null)
                    : email is null ? null : new Recipient(householdId, household.Name, g.Name, g.Language, Channel.Email, email, null, null);
            })
            .OfType<Recipient>().ToList();
        if (recipients.Count == 0)
        {
            return false;
        }
        writer.Queue(MessageSource.LearningBond, title, text, ChannelChoice.TextWithEmailFallback, new Audience(household.Name, recipients),
            new AudienceRequest(null, null, null, text, ChannelChoice.TextWithEmailFallback), _ => text);
        return true;
    }
}
