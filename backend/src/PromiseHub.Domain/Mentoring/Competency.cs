using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>
/// One skill of an organization's competency framework (L2-082, ADR 0057), in order. Seeded until program directors author the framework
/// (prompt 64).
/// </summary>
public sealed class Competency : ITenantOwned
{
    public const int MaximumName = 80;
    public const int MaximumDescription = 300;

    public Competency(Guid id, Guid organizationId, int position, string name, string description)
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
}
