namespace PromiseHub.Domain.Organizations;

/// <summary>The tenant root. Not itself tenant-owned.</summary>
public sealed class Organization
{
    public Organization(Guid id, string name, string city, Plan plan)
    {
        Id = id;
        Name = name;
        City = city;
        Plan = plan;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string City { get; private set; }
    public Plan Plan { get; private set; }
}
