using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>A mentor on a program's team, as its lead or supporting (L2-062, ADR 0048); a mentor may lead one cohort and support another.</summary>
public sealed class CohortMentor : ITenantOwned
{
    public CohortMentor(Guid id, Guid organizationId, Guid programId, Guid mentorMembershipId, bool isLead)
    {
        Id = id;
        OrganizationId = organizationId;
        ProgramId = programId;
        MentorMembershipId = mentorMembershipId;
        IsLead = isLead;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ProgramId { get; private set; }
    public Guid MentorMembershipId { get; private set; }
    public bool IsLead { get; private set; }
}
