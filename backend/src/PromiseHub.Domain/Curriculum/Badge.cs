using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>
/// A badge of the organization (L2-084, ADR 0058): its name, icon and description, how it is earned and, for an automatic badge, the rule
/// and the lesson, module, quiz or assignment it watches; optionally the competency it counts toward. Deleting keeps the row and its awards.
/// </summary>
public sealed class Badge : ITenantOwned
{
    public const int MaximumName = 60;
    public const int MaximumDescription = 200;

    public Badge(Guid id, Guid organizationId, string name, string icon, string? description, BadgeKind kind, BadgeRule? rule, Guid? targetId,
        Guid? competencyId, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        Icon = icon;
        Description = description;
        Kind = kind;
        Rule = rule;
        TargetId = targetId;
        CompetencyId = competencyId;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }
    public string Icon { get; private set; }
    public string? Description { get; private set; }
    public BadgeKind Kind { get; private set; }

    /// <summary>The rule of an automatic badge; null by hand.</summary>
    public BadgeRule? Rule { get; private set; }

    /// <summary>The lesson, module, quiz or assignment the rule watches; null by hand.</summary>
    public Guid? TargetId { get; private set; }
    public Guid? CompetencyId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }

    public void Update(string name, string icon, string? description, BadgeKind kind, BadgeRule? rule, Guid? targetId, Guid? competencyId)
    {
        Name = name;
        Icon = icon;
        Description = description;
        Kind = kind;
        Rule = rule;
        TargetId = targetId;
        CompetencyId = competencyId;
    }

    public void Delete(DateTimeOffset now) => DeletedAt = now;
}
