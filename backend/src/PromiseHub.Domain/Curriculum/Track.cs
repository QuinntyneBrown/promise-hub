using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>A pathway youth follow, such as Leadership Foundations; it holds modules in order (L2-066, ADR 0050).</summary>
public sealed class Track : ITenantOwned
{
    public const int MaximumName = 80;
    public const int MaximumKey = 40;
    public const int MaximumDescription = 500;

    public Track(Guid id, Guid organizationId, string name, string key, string? description, ContentStatus status, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        Key = key;
        Description = description;
        Status = status;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }

    /// <summary>Lowercase letters, numbers and hyphens, unique within the organization; used in reports.</summary>
    public string Key { get; private set; }
    public string? Description { get; private set; }
    public ContentStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public void SetStatus(ContentStatus status) => Status = status;
}
