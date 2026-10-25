using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Attendance;

/// <summary>A child's (or a walk-in's) attendance at one session. The current view; every change also appends an AttendanceEvent.</summary>
public sealed class AttendanceRecord : ITenantOwned
{
    public AttendanceRecord(Guid id, Guid organizationId, Guid eventId, Guid? childId, Guid? walkInId)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        ChildId = childId;
        WalkInId = walkInId;
        Status = AttendanceStatus.NotYet;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public Guid? ChildId { get; private set; }
    public Guid? WalkInId { get; private set; }
    public AttendanceStatus Status { get; private set; }
    public DateTimeOffset? CheckedInAt { get; private set; }
    public DateTimeOffset? MarkedAbsentAt { get; private set; }
    public string? UpdatedBy { get; private set; }

    /// <summary>Checks the child in; allowed from not-yet or absent, which clears the absence.</summary>
    public void CheckIn(DateTimeOffset at, string actor)
    {
        Status = AttendanceStatus.Present;
        CheckedInAt = at;
        MarkedAbsentAt = null;
        UpdatedBy = actor;
    }

    public void MarkAbsent(DateTimeOffset at, string actor)
    {
        Status = AttendanceStatus.Absent;
        CheckedInAt = null;
        MarkedAbsentAt = at;
        UpdatedBy = actor;
    }
}
