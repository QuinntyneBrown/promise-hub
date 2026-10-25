namespace PromiseHub.Domain.Organizations;

/// <summary>Joins a person to one organization with one role.</summary>
public sealed class Membership : ITenantOwned
{
    public Membership(Guid id, Guid organizationId, string personName, string email, Role role)
    {
        Id = id;
        OrganizationId = organizationId;
        PersonName = personName;
        Email = email;
        Role = role;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string PersonName { get; private set; }
    public string Email { get; private set; }
    public Role Role { get; private set; }
}
