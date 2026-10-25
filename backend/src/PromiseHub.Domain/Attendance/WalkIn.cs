using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Attendance;

/// <summary>A child at tonight's session who is not on the roster; on the session's roster only, flagged for the office to enroll.</summary>
public sealed class WalkIn : ITenantOwned
{
    public WalkIn(Guid id, Guid organizationId, Guid eventId, string childName, string guardian, string? medicalNotes)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        ChildName = childName;
        Guardian = guardian;
        MedicalNotes = medicalNotes;
        FollowUp = true;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public string ChildName { get; private set; }

    /// <summary>The guardian's name and phone, as told at the door.</summary>
    public string Guardian { get; private set; }

    public string? MedicalNotes { get; private set; }
    public bool FollowUp { get; private set; }
}
