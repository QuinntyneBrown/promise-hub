namespace PromiseHub.Domain.Organizations;

/// <summary>The tenant root. Not itself tenant-owned.</summary>
public sealed class Organization
{
    public Organization(Guid id, string name, string city, Plan plan, string timeZone = "America/Toronto")
    {
        TimeZone = timeZone;
        Id = id;
        Name = name;
        City = city;
        Plan = plan;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string City { get; private set; }
    public Plan Plan { get; private set; }

    /// <summary>IANA time zone the organization runs its sessions in; "today" is its local date.</summary>
    public string TimeZone { get; private set; }
}
