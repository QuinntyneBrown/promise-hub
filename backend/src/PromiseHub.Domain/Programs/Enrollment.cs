using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Programs;

/// <summary>A child on a program's roster. Ending it keeps the row, so attendance stays in reports.</summary>
public sealed class Enrollment : ITenantOwned
{
    public Enrollment(Guid id, Guid organizationId, Guid programId, Guid childId, DateTimeOffset enrolledAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ProgramId = programId;
        ChildId = childId;
        EnrolledAt = enrolledAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ProgramId { get; private set; }
    public Guid ChildId { get; private set; }
    public DateTimeOffset EnrolledAt { get; private set; }
    public DateTimeOffset? EndedAt { get; private set; }
    public string? EndReason { get; private set; }

    public bool Active => EndedAt is null;

    public void End(DateTimeOffset now, string reason)
    {
        EndedAt = now;
        EndReason = reason;
    }
}
