using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// An admin's request that a named person accept the agreement (L2-137): name, title and email, and a single-use link kept only as its
/// hash, working for 14 days. One is open per organization; a new request, a resend or an acceptance closes the one before.
/// </summary>
public sealed class LearningBondSignerRequest : ITenantOwned
{
    public static readonly TimeSpan LinkLifetime = TimeSpan.FromDays(14);
    public const int MaximumText = 100;

    public LearningBondSignerRequest(Guid id, Guid organizationId, string name, string title, string email, string tokenHash,
        Guid requestedByMembershipId, string requestedByName, DateTimeOffset sentAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        Title = title;
        Email = email;
        TokenHash = tokenHash;
        RequestedByMembershipId = requestedByMembershipId;
        RequestedByName = requestedByName;
        SentAt = sentAt;
        ExpiresAt = sentAt + LinkLifetime;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }
    public string Title { get; private set; }
    public string Email { get; private set; }
    public string TokenHash { get; private set; }
    public Guid RequestedByMembershipId { get; private set; }
    public string RequestedByName { get; private set; }
    public DateTimeOffset SentAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public DateTimeOffset? UsedAt { get; private set; }

    /// <summary>Waiting for the signer: not cancelled, not used and not expired.</summary>
    public bool IsOpen(DateTimeOffset now) => CancelledAt is null && UsedAt is null && ExpiresAt > now;

    /// <summary>A new link to the same signer: the earlier one stops working and the 14 days start again.</summary>
    public void Resend(string tokenHash, DateTimeOffset now)
    {
        TokenHash = tokenHash;
        SentAt = now;
        ExpiresAt = now + LinkLifetime;
    }

    public void Cancel(DateTimeOffset now) => CancelledAt ??= now;

    /// <summary>The signer accepted: the link stops working.</summary>
    public void Use(DateTimeOffset now) => UsedAt ??= now;
}
