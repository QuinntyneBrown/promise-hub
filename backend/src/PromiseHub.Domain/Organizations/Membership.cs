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

    /// <summary>Set when an admin removed this person's access; the row stays so records keep naming who did what.</summary>
    public DateTimeOffset? RemovedAt { get; private set; }

    /// <summary>The staff member's own mobile, for alerts; never shown to guardians (L2-009 criterion 3).</summary>
    public string? Mobile { get; private set; }

    public void SetMobile(string mobile) => Mobile = mobile;

    public void ChangeRole(Role role) => Role = role;

    public void Remove(DateTimeOffset now) => RemovedAt = now;
}
