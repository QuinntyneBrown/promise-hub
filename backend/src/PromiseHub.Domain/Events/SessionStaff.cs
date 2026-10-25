using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Events;

/// <summary>A staff member assigned to work a session. Youth workers run only the sessions they are assigned to.</summary>
public sealed class SessionStaff : ITenantOwned
{
    public SessionStaff(Guid id, Guid organizationId, Guid eventId, Guid membershipId)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        MembershipId = membershipId;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public Guid MembershipId { get; private set; }
}
