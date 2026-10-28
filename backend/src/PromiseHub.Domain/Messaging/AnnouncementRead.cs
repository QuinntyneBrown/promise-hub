using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Messaging;

/// <summary>That one member has read one announcement (L2-105 criterion 6); one row per announcement and member.</summary>
public sealed class AnnouncementRead : ITenantOwned
{
    public AnnouncementRead(Guid id, Guid organizationId, Guid announcementId, Guid membershipId, DateTimeOffset readAt)
    {
        Id = id;
        OrganizationId = organizationId;
        AnnouncementId = announcementId;
        MembershipId = membershipId;
        ReadAt = readAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid AnnouncementId { get; private set; }
    public Guid MembershipId { get; private set; }
    public DateTimeOffset ReadAt { get; private set; }
}
