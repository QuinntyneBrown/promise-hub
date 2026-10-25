using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Households;

public sealed class Household : ITenantOwned
{
    public Household(Guid id, Guid organizationId, string name)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }
}
