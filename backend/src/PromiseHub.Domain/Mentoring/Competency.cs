using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>
/// One skill of an organization's competency framework (L2-082, ADR 0057), in order, within a stage of the progression framework
/// (L2-086, ADR 0058). A removed competency is no longer assessed; its assessments stay.
/// </summary>
public sealed class Competency : ITenantOwned
{
    public const int MaximumName = 80;
    public const int MaximumDescription = 300;

    public Competency(Guid id, Guid organizationId, int position, string name, string description, Guid? stageId = null)
    {
        Id = id;
        OrganizationId = organizationId;
        Position = position;
        Name = name;
        Description = description;
        StageId = stageId;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }

    /// <summary>The order on a mentor's sheet across the whole framework; a new competency goes last.</summary>
    public int Position { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }

    /// <summary>The progression stage it earns; null only for a competency made before stages existed and not yet migrated.</summary>
    public Guid? StageId { get; private set; }
    public DateTimeOffset? RemovedAt { get; private set; }

    public void Remove(DateTimeOffset at) => RemovedAt = at;
}
