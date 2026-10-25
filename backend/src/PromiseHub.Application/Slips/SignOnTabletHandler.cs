using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>
/// Signs a family's unsigned children on the staff tablet (dialog: sign-on-tablet), in the same record format as the
/// guardian's page with the staff member on the device, clears them at once and texts the family a copy (L2-016 criterion 3).
/// </summary>
public sealed class SignOnTabletHandler(IPromiseHubDb db, ITenantContext tenant, SlipFamilies families, AudienceResolver resolver, MessageWriter writer, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid slipId, SignOnTabletCommand command, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        var e = slip is null ? null : await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == slip.EventId, cancellationToken);
        if (slip is null || e is null)
        {
            return Result.NotFound;
        }
        var family = (await families.UnsignedAsync(slip, e, cancellationToken)).FirstOrDefault(f => f.HouseholdId == command.HouseholdId);
        if (slip.Status != SlipStatus.Sent || family is null)
        {
            return Result.Conflict;
        }
        var typed = string.Join(' ', (command.Name ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries));
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == family.HouseholdId).ToListAsync(cancellationToken);
        if (typed.Length == 0)
        {
            return Result.Invalid(new Dictionary<string, string> { ["name"] = "The guardian needs to type their full name." });
        }
        var signer = guardians.FirstOrDefault(g => g.CanSign && string.Equals(g.Name, typed, StringComparison.OrdinalIgnoreCase));
        if (signer is null)
        {
            return Result.Invalid(new Dictionary<string, string> { ["name"] = "That name doesn’t match a guardian of this family." });
        }
        var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == family.HouseholdId, cancellationToken);
        var now = clock.GetUtcNow();
        var answers = JsonSerializer.Serialize(new { photos = command.Photos, lunch = command.Lunch });
        foreach (var child in family.Children)
        {
            var signature = new SlipSignature(Guid.NewGuid(), tenant.OrganizationId, slip.Id, child.Id, slip.Version, SignatureStatus.Signed, signer.Name, now);
            signature.Given($"Staff tablet · {tenant.ActorName}", household.Language, GuardianTokens.Hash(slip.Body), answers, null);
            db.SlipSignatures.Add(signature);
        }
        var names = SlipReminderSender.Names(family);
        var request = new AudienceRequest(null, e.Id, null, null, ChannelChoice.TextWithEmailFallback);
        var audience = await resolver.ResolveAsync(request, cancellationToken);
        var copy = $"{names} {(family.Children.Count == 1 ? "is" : "are")} cleared for “{slip.Title}”. Signed on a staff tablet by {signer.Name}.";
        writer.Queue(MessageSource.Slips, $"Signed: {slip.Title}", copy, request.Channel,
            new Audience(audience.Label, [.. audience.Recipients.Where(r => r.HouseholdId == family.HouseholdId)]), request);
        audit.Record(new AuditEvent(AuditAction.Signed, "PermissionSlip", slip.Id, $"{names} · signed on a staff tablet by {signer.Name}, witnessed by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
