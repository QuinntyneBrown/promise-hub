using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>A badge a youth holds (L2-085, ADR 0058): once per badge and youth membership, with who awarded it (null when the server did).</summary>
public sealed class BadgeAward : ITenantOwned
{
    public BadgeAward(Guid id, Guid organizationId, Guid badgeId, Guid membershipId, DateTimeOffset awardedAt, string? awardedBy)
    {
        Id = id;
        OrganizationId = organizationId;
        BadgeId = badgeId;
        MembershipId = membershipId;
        AwardedAt = awardedAt;
        AwardedBy = awardedBy;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid BadgeId { get; private set; }
    public Guid MembershipId { get; private set; }
    public DateTimeOffset AwardedAt { get; private set; }

    /// <summary>The name of the program director who awarded it by hand; null for an automatic award.</summary>
    public string? AwardedBy { get; private set; }
}
