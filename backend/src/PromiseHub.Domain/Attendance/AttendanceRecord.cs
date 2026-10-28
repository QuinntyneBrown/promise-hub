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
    public DateTimeOffset? SignedOutAt { get; private set; }

    /// <summary>The adult who collected the child: an approved guardian's name or the name given for someone else.</summary>
    public string? CollectedBy { get; private set; }

    public Guid? CollectorGuardianId { get; private set; }

    /// <summary>True when someone not on the approved list collected the child with the guardian's okay by phone.</summary>
    public bool ConfirmedByPhone { get; private set; }

    public bool IdChecked { get; private set; }

    /// <summary>
    /// True when a check-in made earlier on one device reached the server after another device marked the child absent:
    /// both events are kept, present wins, and staff see the conflict (L2-028 criterion 3).
    /// </summary>
    public bool HasConflict { get; private set; }

    /// <summary>The check-in came after the start (L2-095, ADR 0065); kept through sign-out so the history still counts it late.</summary>
    public bool Late { get; private set; }

    /// <summary>The absence is one the organization accepts (L2-095, ADR 0065).</summary>
    public bool Excused { get; private set; }

    /// <summary>Checks the child in, late or not; allowed from not-yet or absent, which clears the absence.</summary>
    public void CheckIn(DateTimeOffset at, string actor, bool late = false)
    {
        if (Status == AttendanceStatus.Absent && MarkedAbsentAt > at)
        {
            HasConflict = true;
        }
        Status = AttendanceStatus.Present;
        CheckedInAt = at;
        MarkedAbsentAt = null;
        Late = late;
        Excused = false;
        UpdatedBy = actor;
    }

    public void MarkAbsent(DateTimeOffset at, string actor, bool excused = false)
    {
        Status = AttendanceStatus.Absent;
        Late = false;
        Excused = excused;
        CheckedInAt = null;
        MarkedAbsentAt = at;
        UpdatedBy = actor;
    }

    /// <summary>
    /// Sets the mark an admin or program director decided on after the fact (L2-097, ADR 0065). A child corrected to present or late
    /// who had no check-in time is taken to have arrived at the start; a signed-out child stays signed out.
    /// </summary>
    public void Correct(AttendanceMark mark, DateTimeOffset sessionStart, DateTimeOffset at, string actor)
    {
        if (mark is AttendanceMark.Present or AttendanceMark.Late)
        {
            if (Status != AttendanceStatus.SignedOut)
            {
                Status = AttendanceStatus.Present;
            }
            CheckedInAt ??= sessionStart;
            MarkedAbsentAt = null;
            Late = mark == AttendanceMark.Late;
            Excused = false;
        }
        else
        {
            Status = AttendanceStatus.Absent;
            CheckedInAt = null;
            SignedOutAt = null;
            CollectedBy = null;
            CollectorGuardianId = null;
            MarkedAbsentAt ??= at;
            Late = false;
            Excused = mark == AttendanceMark.Excused;
        }
        UpdatedBy = actor;
    }

    /// <summary>Signs a checked-in child out to the adult who collected them (L2-017 criterion 3).</summary>
    public void SignOut(DateTimeOffset at, string collectedBy, Guid? guardianId, bool confirmedByPhone, bool idChecked, string actor)
    {
        Status = AttendanceStatus.SignedOut;
        SignedOutAt = at;
        CollectedBy = collectedBy;
        CollectorGuardianId = guardianId;
        ConfirmedByPhone = confirmedByPhone;
        IdChecked = idChecked;
        UpdatedBy = actor;
    }
}
