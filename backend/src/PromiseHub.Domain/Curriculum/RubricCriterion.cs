using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>One criterion of an assignment's rubric at a position, worth 1 to 100 points (L2-074 criterion 4).</summary>
public sealed class RubricCriterion : ITenantOwned
{
    public const int MaximumDescription = 200;
    public const int MaximumPoints = 100;

    public RubricCriterion(Guid id, Guid organizationId, Guid assignmentId, int position, string description, int points)
    {
        Id = id;
        OrganizationId = organizationId;
        AssignmentId = assignmentId;
        Position = position;
        Description = description;
        Points = points;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid AssignmentId { get; private set; }
    public int Position { get; private set; }
    public string Description { get; private set; }
    public int Points { get; private set; }
}
