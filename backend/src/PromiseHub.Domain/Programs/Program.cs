using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Programs;

/// <summary>A program children enroll in. Archiving hides it from pickers and navigation; nothing is deleted.</summary>
public sealed class Program : ITenantOwned
{
    public Program(Guid id, Guid organizationId, string name, DateOnly startsOn, DateOnly endsOn, string? schedule, int capacity, string? ages, bool enrollmentOpen, bool seasonConsent)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        StartsOn = startsOn;
        EndsOn = endsOn;
        Schedule = schedule;
        Capacity = capacity;
        Ages = ages;
        EnrollmentOpen = enrollmentOpen;
        SeasonConsent = seasonConsent;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }
    public DateOnly StartsOn { get; private set; }
    public DateOnly EndsOn { get; private set; }

    /// <summary>Free text shown to guardians, such as "Mon–Thu, 4–6 pm".</summary>
    public string? Schedule { get; private set; }

    public int Capacity { get; private set; }
    public string? Ages { get; private set; }
    public bool EnrollmentOpen { get; private set; }
    public bool SeasonConsent { get; private set; }
    public ProgramStatus Status { get; private set; }
    public DateTimeOffset? ArchivedAt { get; private set; }
    public string? ArchivedBy { get; private set; }

    public void Update(string name, DateOnly startsOn, DateOnly endsOn, string? schedule, int capacity, string? ages, bool enrollmentOpen, bool seasonConsent)
    {
        Name = name;
        StartsOn = startsOn;
        EndsOn = endsOn;
        Schedule = schedule;
        Capacity = capacity;
        Ages = ages;
        EnrollmentOpen = enrollmentOpen;
        SeasonConsent = seasonConsent;
    }

    public void Archive(string actor, DateTimeOffset now)
    {
        Status = ProgramStatus.Archived;
        EnrollmentOpen = false;
        ArchivedAt = now;
        ArchivedBy = actor;
    }

    /// <summary>Back to active; enrollment stays closed until a director opens it.</summary>
    public void Restore()
    {
        Status = ProgramStatus.Active;
        ArchivedAt = null;
        ArchivedBy = null;
    }
}
