namespace PromiseHub.Domain.Organizations;

/// <summary>The tenant root. Not itself tenant-owned.</summary>
public sealed class Organization
{
    public Organization(Guid id, string name, string city, Plan plan, string timeZone = "America/Toronto", string? phone = null)
    {
        Phone = phone;
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

    /// <summary>The number guardians call, shown in the footer of every guardian page.</summary>
    public string? Phone { get; private set; }

    /// <summary>When an admin confirmed the name and city in setup (L2-008); null until then.</summary>
    public DateTimeOffset? ProfileConfirmedAt { get; private set; }

    /// <summary>When the last payment failed; null while payments are current. Service continues for the grace period.</summary>
    public DateTimeOffset? PaymentFailedAt { get; private set; }

    public void ChangePlan(Plan plan) => Plan = plan;

    public void PaymentFailed(DateTimeOffset now) => PaymentFailedAt ??= now;

    public void PaymentRecovered() => PaymentFailedAt = null;

    public void ChangeProfile(string name, string city, DateTimeOffset now)
    {
        Name = name;
        City = city;
        ProfileConfirmedAt ??= now;
    }
}
