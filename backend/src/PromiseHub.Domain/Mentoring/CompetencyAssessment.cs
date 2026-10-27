using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>
/// One mentor's level and note for one child and competency, with who and when (L2-082, ADR 0057). Appended, never changed: the latest per
/// competency is what shows.
/// </summary>
public sealed class CompetencyAssessment : ITenantOwned
{
    public const int MaximumNotes = 2000;

    public CompetencyAssessment(Guid id, Guid organizationId, Guid childId, Guid competencyId, CompetencyLevel level, string? notes,
        Guid assessorMembershipId, string assessorName, DateTimeOffset at)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        CompetencyId = competencyId;
        Level = level;
        Notes = notes;
        AssessorMembershipId = assessorMembershipId;
        AssessorName = assessorName;
        At = at;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid CompetencyId { get; private set; }
    public CompetencyLevel Level { get; private set; }
    public string? Notes { get; private set; }
    public Guid AssessorMembershipId { get; private set; }
    public string AssessorName { get; private set; }
    public DateTimeOffset At { get; private set; }
}
