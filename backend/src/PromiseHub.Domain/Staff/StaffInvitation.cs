using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Staff;

/// <summary>
/// An email invitation to join the organization with a role (L2-009, L2-051). Only the token's hash is stored; it lasts 14
/// days and an admin can withdraw it before it is accepted or resend it with a fresh link. A Youth invitation names the
/// child record the new account links to (ADR 0045).
/// </summary>
public sealed class StaffInvitation : ITenantOwned
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(14);

    public StaffInvitation(Guid id, Guid organizationId, string email, Role role, string tokenHash, string invitedBy, DateTimeOffset invitedAt, Guid? childId = null)
    {
        Id = id;
        OrganizationId = organizationId;
        Email = email;
        Role = role;
        TokenHash = tokenHash;
        InvitedBy = invitedBy;
        InvitedAt = invitedAt;
        ExpiresAt = invitedAt + Lifetime;
        ChildId = childId;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Email { get; private set; }
    public Role Role { get; private set; }
    public string TokenHash { get; private set; }
    public string InvitedBy { get; private set; }
    public DateTimeOffset InvitedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? AcceptedAt { get; private set; }
    public DateTimeOffset? WithdrawnAt { get; private set; }

    /// <summary>The child record a Youth invitation links the new account to; null for every other role.</summary>
    public Guid? ChildId { get; private set; }

    /// <summary>When the invitee, holding the expired link, asked for a new one (L2-054); cleared by a resend.</summary>
    public DateTimeOffset? ReplacementRequestedAt { get; private set; }

    public bool Open(DateTimeOffset now) => AcceptedAt is null && WithdrawnAt is null && ExpiresAt > now;

    /// <summary>Neither accepted nor withdrawn, and past its expiry: still listed so it can be resent.</summary>
    public bool Expired(DateTimeOffset now) => AcceptedAt is null && WithdrawnAt is null && ExpiresAt <= now;

    public void Withdraw(DateTimeOffset now) => WithdrawnAt = now;

    public void Accept(DateTimeOffset now) => AcceptedAt = now;

    /// <summary>A fresh link on the same invitation: the previous token stops working and the 14 days start again.</summary>
    public void Reissue(string tokenHash, DateTimeOffset now)
    {
        TokenHash = tokenHash;
        ExpiresAt = now + Lifetime;
        ReplacementRequestedAt = null;
    }

    /// <summary>Records the first request for a new link; answers false when one was already recorded.</summary>
    public bool RequestReplacement(DateTimeOffset now)
    {
        if (ReplacementRequestedAt is not null)
        {
            return false;
        }
        ReplacementRequestedAt = now;
        return true;
    }
}
