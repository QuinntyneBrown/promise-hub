using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Households;

public sealed class Child : ITenantOwned
{
    public Child(Guid id, Guid organizationId, Guid householdId, string firstName, string lastName)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        FirstName = firstName;
        LastName = lastName;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
}
