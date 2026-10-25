using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Slips;

/// <summary>An event's permission slip. Created as a draft when an event needs one (L2-012 criterion 2); written and sent in Slips.</summary>
public sealed class PermissionSlip : ITenantOwned
{
    public PermissionSlip(Guid id, Guid organizationId, Guid eventId, DateOnly signBy)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        SignBy = signBy;
        Status = SlipStatus.Draft;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public DateOnly SignBy { get; private set; }
    public SlipStatus Status { get; private set; }
}
