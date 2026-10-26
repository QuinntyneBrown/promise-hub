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

    /// <summary>Where the organization's data is stored; set when it is created and changed only by a platform admin (L2-030).</summary>
    public string Region { get; private set; } = DefaultRegion;

    public const string DefaultRegion = "Canada (Toronto region)";

    /// <summary>When an admin confirmed the name and city in setup (L2-008); null until then.</summary>
    public DateTimeOffset? ProfileConfirmedAt { get; private set; }

    /// <summary>When the last payment failed; null while payments are current. Service continues for the grace period.</summary>
    public DateTimeOffset? PaymentFailedAt { get; private set; }

    /// <summary>When a platform admin suspended the organization; null while it runs (L2-003). Suspension deletes nothing.</summary>
    public DateTimeOffset? SuspendedAt { get; private set; }

    public string? SuspensionReason { get; private set; }

    /// <summary>The lower-case name in the public website's address (<c>/site/{slug}</c>); null until chosen (ADR 0043).</summary>
    public string? WebsiteSlug { get; private set; }

    public void ChangeWebsiteSlug(string slug) => WebsiteSlug = slug;

    public void Suspend(string reason, DateTimeOffset now)
    {
        SuspendedAt = now;
        SuspensionReason = reason;
    }

    public void Reinstate()
    {
        SuspendedAt = null;
        SuspensionReason = null;
    }

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
