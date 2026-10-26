using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Staff;

/// <summary>
/// An email invitation to join the organization with a role (L2-009). Only the token's hash is stored; it lasts 14 days and
/// an admin can withdraw it before it is accepted.
/// </summary>
public sealed class StaffInvitation : ITenantOwned
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(14);

    public StaffInvitation(Guid id, Guid organizationId, string email, Role role, string tokenHash, string invitedBy, DateTimeOffset invitedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Email = email;
        Role = role;
        TokenHash = tokenHash;
        InvitedBy = invitedBy;
        InvitedAt = invitedAt;
        ExpiresAt = invitedAt + Lifetime;
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

    public bool Open(DateTimeOffset now) => AcceptedAt is null && WithdrawnAt is null && ExpiresAt > now;

    public void Withdraw(DateTimeOffset now) => WithdrawnAt = now;

    public void Accept(DateTimeOffset now) => AcceptedAt = now;
}
