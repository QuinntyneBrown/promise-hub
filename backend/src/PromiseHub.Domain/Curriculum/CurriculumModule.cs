using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>A module of a track, at a position that is the order youth see (L2-066, ADR 0050). Named to stay apart from feature modules (ModuleId).</summary>
public sealed class CurriculumModule : ITenantOwned
{
    public const int MaximumTitle = 80;
    public const int MaximumDescription = 1000;
    public const int MaximumAnchor = 500;

    public CurriculumModule(Guid id, Guid organizationId, Guid trackId, string title, string? description, int position)
    {
        Id = id;
        OrganizationId = organizationId;
        TrackId = trackId;
        Title = title;
        Description = description;
        Position = position;
        Status = ContentStatus.Draft;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid TrackId { get; private set; }
    public string Title { get; private set; }
    public string? Description { get; private set; }

    /// <summary>An earlier module of the same track that youth finish first.</summary>
    public Guid? PrerequisiteModuleId { get; private set; }

    /// <summary>A quote or reading the module keeps coming back to.</summary>
    public string? Anchor { get; private set; }
    public int Position { get; private set; }
    public ContentStatus Status { get; private set; }

    public void Update(string title, string? description, Guid? prerequisiteModuleId, string? anchor)
    {
        Title = title;
        Description = description;
        PrerequisiteModuleId = prerequisiteModuleId;
        Anchor = anchor;
    }

    public void MoveTo(int position) => Position = position;

    public void SetStatus(ContentStatus status) => Status = status;
}
