namespace PromiseHub.Domain.Organizations;

/// <summary>Which modules an organization has on. Turning a module off hides it; no other data changes.</summary>
public sealed class ModuleConfiguration : ITenantOwned
{
    public ModuleConfiguration(Guid id, Guid organizationId, string modulesOn, DateTimeOffset updatedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ModulesOn = modulesOn;
        UpdatedAt = updatedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }

    /// <summary>Comma-separated module ids, stored in catalog order.</summary>
    public string ModulesOn { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public IReadOnlySet<ModuleId> On =>
        ModulesOn.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Enum.Parse<ModuleId>).ToHashSet();

    public static string Format(IEnumerable<ModuleId> modules) =>
        string.Join(',', ModuleCatalog.All.Where(modules.Contains));

    public void Set(IReadOnlySet<ModuleId> on, DateTimeOffset now)
    {
        ModulesOn = Format(on);
        UpdatedAt = now;
    }
}
