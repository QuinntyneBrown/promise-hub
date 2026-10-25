using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Attendance;

/// <summary>
/// Someone not on the approved list has come to collect a child: staff ask the guardian, who approves or refuses from the
/// family page; a refusal is logged as an incident (L2-020 criterion 7).
/// </summary>
public sealed class PickupRequest : ITenantOwned
{
    public PickupRequest(Guid id, Guid organizationId, Guid eventId, Guid childId, Guid householdId, string collectorName, Guid requestedById, string requestedBy, DateTimeOffset requestedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        ChildId = childId;
        HouseholdId = householdId;
        CollectorName = collectorName;
        RequestedById = requestedById;
        RequestedBy = requestedBy;
        RequestedAt = requestedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string CollectorName { get; private set; }
    public Guid RequestedById { get; private set; }
    public string RequestedBy { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public PickupRequestStatus Status { get; private set; }
    public string? DecidedBy { get; private set; }
    public DateTimeOffset? DecidedAt { get; private set; }
    public Guid? IncidentId { get; private set; }

    public void Decide(bool approve, string guardian, DateTimeOffset now)
    {
        Status = approve ? PickupRequestStatus.Approved : PickupRequestStatus.Refused;
        DecidedBy = guardian;
        DecidedAt = now;
    }

    public void Logged(Guid incidentId) => IncidentId = incidentId;

    public bool IsFor(string name) => string.Equals(CollectorName, name.Trim(), StringComparison.OrdinalIgnoreCase);
}
