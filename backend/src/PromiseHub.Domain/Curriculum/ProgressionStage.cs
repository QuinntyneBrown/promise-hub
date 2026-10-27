using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>
/// One stage of the organization's progression framework (L2-086, ADR 0058), in order: a step on a youth's journey, earned through the
/// competencies in it (<see cref="Mentoring.Competency.StageId"/>).
/// </summary>
public sealed class ProgressionStage : ITenantOwned
{
    public const int MaximumName = 60;
    public const int MaximumDescription = 200;

    public ProgressionStage(Guid id, Guid organizationId, int position, string name, string description)
    {
        Id = id;
        OrganizationId = organizationId;
        Position = position;
        Name = name;
        Description = description;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public int Position { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }

    public void Rename(string name, string description)
    {
        Name = name;
        Description = description;
    }

    public void MoveTo(int position) => Position = position;
}
