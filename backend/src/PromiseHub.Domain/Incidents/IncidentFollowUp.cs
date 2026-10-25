using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Incidents;

/// <summary>A follow-up note on an incident; kept and added even after the incident is closed.</summary>
public sealed class IncidentFollowUp : ITenantOwned
{
    public IncidentFollowUp(Guid id, Guid organizationId, Guid incidentId, string text, string writtenBy, DateTimeOffset writtenAt)
    {
        Id = id;
        OrganizationId = organizationId;
        IncidentId = incidentId;
        Text = text;
        WrittenBy = writtenBy;
        WrittenAt = writtenAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid IncidentId { get; private set; }
    public string Text { get; private set; }
    public string WrittenBy { get; private set; }
    public DateTimeOffset WrittenAt { get; private set; }
}
