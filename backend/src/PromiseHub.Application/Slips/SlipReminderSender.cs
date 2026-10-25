using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Reminds the given families through the message path, each with fresh links for its unsigned children, and records each reminder.</summary>
public sealed class SlipReminderSender(IPromiseHubDb db, ITenantContext tenant, AudienceResolver resolver, MessageWriter writer, GuardianLinkIssuer links, TimeProvider clock)
{
    public async Task<int> RemindAsync(PermissionSlip slip, Event e, IReadOnlyList<SlipFamily> families, ReminderKind kind, string slot,
        Func<SlipFamily, string, string> text, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        foreach (var family in families)
        {
            db.SlipReminders.Add(new SlipReminder(Guid.NewGuid(), tenant.OrganizationId, slip.Id, family.HouseholdId, kind, slot, now, !family.Reachable));
        }
        var reachable = families.Where(f => f.Reachable).ToDictionary(f => f.HouseholdId);
        if (reachable.Count == 0)
        {
            return 0;
        }
        var request = new AudienceRequest(null, e.Id, null, null, slip.Channel == SlipChannel.EmailOnly ? ChannelChoice.EmailOnly : ChannelChoice.TextWithEmailFallback);
        var audience = await resolver.ResolveAsync(request, cancellationToken);
        var recipients = audience.Recipients.Where(r => reachable.ContainsKey(r.HouseholdId)).ToList();
        string For(Recipient r)
        {
            var family = reachable[r.HouseholdId];
            var linkText = family.Children.Count == 1
                ? links.Issue(family.HouseholdId, slip.Id, family.Children[0].Id)
                : string.Join(" · ", family.Children.Select(c => $"{c.FirstName}: {links.Issue(family.HouseholdId, slip.Id, c.Id)}"));
            return text(family, linkText);
        }
        writer.Queue(MessageSource.Slips, $"Reminder: {slip.Title}", $"Reminder: please sign the permission slip for “{slip.Title}”.", request.Channel,
            new Audience(audience.Label, recipients), request, For);
        return recipients.Count;
    }

    public static string Names(SlipFamily family) => family.Children.Count switch
    {
        1 => family.Children[0].FirstName,
        _ => $"{string.Join(", ", family.Children.Take(family.Children.Count - 1).Select(c => c.FirstName))} and {family.Children[^1].FirstName}",
    };
}
