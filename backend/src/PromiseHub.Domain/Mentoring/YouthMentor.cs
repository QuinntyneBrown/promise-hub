using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>The one mentor a child has in an organization (L2-062, ADR 0048); assigning again replaces the mentor.</summary>
public sealed class YouthMentor : ITenantOwned
{
    public YouthMentor(Guid id, Guid organizationId, Guid childId, Guid mentorMembershipId, DateTimeOffset assignedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        MentorMembershipId = mentorMembershipId;
        AssignedAt = assignedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid MentorMembershipId { get; private set; }
    public DateTimeOffset AssignedAt { get; private set; }

    public void Reassign(Guid mentorMembershipId, DateTimeOffset now)
    {
        MentorMembershipId = mentorMembershipId;
        AssignedAt = now;
    }
}
