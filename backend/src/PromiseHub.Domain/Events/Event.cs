using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Events;

/// <summary>A session or trip of a program. Its roster is the program's.</summary>
public sealed class Event : ITenantOwned
{
    public Event(Guid id, Guid organizationId, Guid programId, string name, DateTimeOffset startsAt, DateTimeOffset endsAt, string? place, bool requiresSlip, bool noShowAlert, string? staffNotes)
    {
        Id = id;
        OrganizationId = organizationId;
        ProgramId = programId;
        Name = name;
        StartsAt = startsAt;
        EndsAt = endsAt;
        Place = place;
        RequiresSlip = requiresSlip;
        NoShowAlert = noShowAlert;
        StaffNotes = staffNotes;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ProgramId { get; private set; }
    public string Name { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
    public string? Place { get; private set; }
    public bool RequiresSlip { get; private set; }

    /// <summary>Text guardians when a child is not checked in shortly after the start.</summary>
    public bool NoShowAlert { get; private set; }

    public string? StaffNotes { get; private set; }
    public EventStatus Status { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public string? CancelledBy { get; private set; }
    public string? CancellationMessage { get; private set; }
    public bool GuardiansTold { get; private set; }

    public void Update(Guid programId, string name, DateTimeOffset startsAt, DateTimeOffset endsAt, string? place, bool requiresSlip, bool noShowAlert, string? staffNotes)
    {
        ProgramId = programId;
        Name = name;
        StartsAt = startsAt;
        EndsAt = endsAt;
        Place = place;
        RequiresSlip = requiresSlip;
        NoShowAlert = noShowAlert;
        StaffNotes = staffNotes;
    }

    public DateTimeOffset? EndedAt { get; private set; }
    public string? EndedBy { get; private set; }

    /// <summary>The site lead's notes for the next site lead or the director.</summary>
    public string? SessionNotes { get; private set; }

    public void End(string actor, DateTimeOffset now)
    {
        Status = EventStatus.Ended;
        EndedAt = now;
        EndedBy = actor;
    }

    public void SaveNotes(string? notes) => SessionNotes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();

    public void Cancel(string actor, DateTimeOffset now, string? message, bool tellGuardians)
    {
        Status = EventStatus.Cancelled;
        CancelledAt = now;
        CancelledBy = actor;
        CancellationMessage = message;
        GuardiansTold = tellGuardians;
    }
}
