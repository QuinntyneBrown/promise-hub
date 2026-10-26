using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Households;

public sealed class Guardian : ITenantOwned, ISoftDeletable
{
    public Guardian(
        Guid id,
        Guid organizationId,
        Guid householdId,
        string name,
        string relationship,
        string? mobile,
        string? email,
        string language,
        bool isPrimary,
        bool canPickUp,
        bool canSign)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        Name = name;
        Relationship = relationship;
        Mobile = mobile;
        Email = email;
        Language = language;
        IsPrimary = isPrimary;
        CanPickUp = canPickUp;
        CanSign = canSign;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string Name { get; private set; }
    public string Relationship { get; private set; }
    public string? Mobile { get; private set; }
    public string? Email { get; private set; }
    public string Language { get; private set; }
    public bool IsPrimary { get; private set; }
    public bool CanPickUp { get; private set; }
    public bool CanSign { get; private set; }

    /// <summary>Set when mail to <see cref="Email"/> bounced; the address is then no way to reach them.</summary>
    public bool EmailBounced { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    /// <summary>True when there is a mobile number or a working email.</summary>
    public bool Reachable => !string.IsNullOrWhiteSpace(Mobile) || (!string.IsNullOrWhiteSpace(Email) && !EmailBounced);

    public void Update(string name, string relationship, string? mobile, bool canPickUp, bool canSign)
    {
        Name = name;
        Relationship = relationship;
        Mobile = mobile;
        CanPickUp = canPickUp;
        CanSign = canSign;
    }

    /// <summary>The guardian corrects how to reach them from the family page (L2-011 criterion 7); a new email is assumed to work.</summary>
    public void UpdateContact(string? mobile, string? email, string language)
    {
        if (!string.Equals(Email, email, StringComparison.OrdinalIgnoreCase))
        {
            EmailBounced = false;
        }
        Mobile = mobile;
        Email = email;
        Language = language;
    }

    public void MarkEmailBounced() => EmailBounced = true;

    public void SoftDelete(DateTimeOffset now) => DeletedAt = now;
}
