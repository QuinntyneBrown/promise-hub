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

    /// <summary>The child record a Youth membership links to (L2-045); null for every other role and until an admin links one.</summary>
    public Guid? ChildId { get; private set; }

    /// <summary>Set while an admin has turned this account off (ADR 0070); reversible, unlike <see cref="RemovedAt"/>.</summary>
    public DateTimeOffset? DeactivatedAt { get; private set; }

    /// <summary>Who turned it off, directly or by deleting the household of a youth's child record.</summary>
    public string? DeactivatedBy { get; private set; }

    /// <summary>Not removed and not deactivated: the membership can start or continue a session.</summary>
    public bool IsActive => RemovedAt is null && DeactivatedAt is null;

    public void SetMobile(string? mobile) => Mobile = mobile;

    public void Rename(string personName) => PersonName = personName;

    public void Deactivate(DateTimeOffset now, string by)
    {
        DeactivatedAt = now;
        DeactivatedBy = by;
    }

    public void Reactivate()
    {
        DeactivatedAt = null;
        DeactivatedBy = null;
    }

    public void LinkChild(Guid childId) => ChildId = childId;

    public void ChangeRole(Role role) => Role = role;

    public void Remove(DateTimeOffset now) => RemovedAt = now;
}
