using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>
/// A lesson, quiz or assignment a mentor assigned to one youth with a due date and an optional message (L2-092, ADR 0063): one row per youth
/// and item, so assigning it again updates the row. ProgramId is the cohort it went through, null for chosen youth. Never deleted.
/// </summary>
public sealed class AssignedWork : ITenantOwned
{
    public const int MaximumMessage = 500;

    public AssignedWork(Guid id, Guid organizationId, Guid childId, AssignedWorkKind kind, Guid itemId, Guid? programId, DateOnly dueOn, string? message,
        Guid assignedByMembershipId, DateTimeOffset assignedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        Kind = kind;
        ItemId = itemId;
        ProgramId = programId;
        DueOn = dueOn;
        Message = message;
        AssignedByMembershipId = assignedByMembershipId;
        AssignedAt = assignedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public AssignedWorkKind Kind { get; private set; }
    public Guid ItemId { get; private set; }
    public Guid? ProgramId { get; private set; }
    public DateOnly DueOn { get; private set; }
    public string? Message { get; private set; }
    public Guid AssignedByMembershipId { get; private set; }
    public DateTimeOffset AssignedAt { get; private set; }

    public void Reassign(Guid? programId, DateOnly dueOn, string? message, Guid assignedByMembershipId, DateTimeOffset assignedAt)
    {
        ProgramId = programId;
        DueOn = dueOn;
        Message = message;
        AssignedByMembershipId = assignedByMembershipId;
        AssignedAt = assignedAt;
    }
}
