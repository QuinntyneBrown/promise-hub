using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Staff;

/// <summary>
/// Youth accounts from the child record (L2-051, page: child; dialog: invite-youth). The tenant filter makes another
/// organization's child not found. Only children aged 12 to 18 with no youth account and no invitation waiting are invited,
/// and the invitation names the child the new account links to (ADR 0045).
/// </summary>
public sealed class YouthInvitationHandler(IPromiseHubDb db, InvitationIssuer issuer, Organizations.ITenantContext tenant, TimeProvider clock)
{
    public const int YoungestAge = 12;
    public const int OldestAge = 18;

    public async Task<YouthAccountDto?> AccountAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        if (!await db.Children.AsNoTracking().AnyAsync(c => c.Id == childId, cancellationToken))
        {
            return null;
        }
        var member = await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.ChildId == childId && m.RemovedAt == null, cancellationToken);
        if (member is not null)
        {
            return new YouthAccountDto("Active", member.PersonName, member.Email, null);
        }
        var waiting = await WaitingAsync(childId, cancellationToken);
        return waiting is null
            ? new YouthAccountDto("None", null, null, null)
            : new YouthAccountDto("Invited", null, waiting.Email, waiting.ExpiresAt);
    }

    public async Task<Result> InviteAsync(Guid childId, InviteYouthCommand command, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return Result.NotFound;
        }
        var address = command.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        var age = child.AgeOn(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime));
        if (age is null or < YoungestAge or > OldestAge)
        {
            errors["childId"] = $"Youth accounts are for ages {YoungestAge} to {OldestAge}.";
        }
        else if (await db.Memberships.AnyAsync(m => m.ChildId == child.Id && m.RemovedAt == null, cancellationToken))
        {
            errors["childId"] = $"{child.FullName} already has a youth account.";
        }
        else if (await WaitingAsync(child.Id, cancellationToken) is not null)
        {
            errors["childId"] = $"An invitation for {child.FullName} is already waiting.";
        }
        if (!address.Contains('@', StringComparison.Ordinal) || !address.Split('@')[^1].Contains('.', StringComparison.Ordinal))
        {
            errors["email"] = "Enter an email like name@example.org.";
        }
        else if (await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.Email == address && m.RemovedAt == null, cancellationToken) is { } member)
        {
            errors["email"] = $"{member.PersonName} already has access.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var invitation = await issuer.IssueAsync(address, Role.Youth, child.Id, $"{address} invited as Youth for {child.FullName} by {tenant.ActorName}", cancellationToken);
        return Result.Created(invitation.Id);
    }

    /// <summary>The child's invitation not yet accepted or withdrawn, expired or not: an expired one is resent, not replaced (ADR 0045).</summary>
    private async Task<Domain.Staff.StaffInvitation?> WaitingAsync(Guid childId, CancellationToken cancellationToken) =>
        await db.StaffInvitations.AsNoTracking().FirstOrDefaultAsync(i => i.ChildId == childId && i.AcceptedAt == null && i.WithdrawnAt == null, cancellationToken);
}
