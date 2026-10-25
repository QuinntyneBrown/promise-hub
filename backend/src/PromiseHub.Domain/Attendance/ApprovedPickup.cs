using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Attendance;

/// <summary>
/// An adult besides the guardians who may collect a child (L2-020). Removal keeps the row, so sign-outs that named the
/// adult keep their history.
/// </summary>
public sealed class ApprovedPickup : ITenantOwned
{
    public ApprovedPickup(Guid id, Guid organizationId, Guid childId, Guid householdId, string name, string relationship, string? mobile, bool addedByGuardian, string addedBy, DateTimeOffset addedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        HouseholdId = householdId;
        Name = name;
        Relationship = relationship;
        Mobile = mobile;
        AddedByGuardian = addedByGuardian;
        AddedBy = addedBy;
        AddedAt = addedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string Name { get; private set; }
    public string Relationship { get; private set; }
    public string? Mobile { get; private set; }
    public bool AddedByGuardian { get; private set; }
    public string AddedBy { get; private set; }
    public DateTimeOffset AddedAt { get; private set; }
    public DateTimeOffset? RemovedAt { get; private set; }
    public string? RemovedBy { get; private set; }

    public void Remove(string actor, DateTimeOffset now)
    {
        RemovedAt = now;
        RemovedBy = actor;
    }
}
