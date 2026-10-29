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

    /// <summary>Where families and youth can write to the organization; null until given (L2-122).</summary>
    public string? ContactEmail { get; private set; }

    /// <summary>The stored logo's file-storage key; null until a logo is uploaded (L2-123, ADR 0050).</summary>
    public string? LogoKey { get; private set; }

    public string? LogoFileName { get; private set; }

    public string? LogoContentType { get; private set; }

    public DateTimeOffset? LogoUploadedAt { get; private set; }

    public string? LogoUploadedBy { get; private set; }

    public void AttachLogo(string key, string fileName, string contentType, DateTimeOffset at, string by)
    {
        LogoKey = key;
        LogoFileName = fileName;
        LogoContentType = contentType;
        LogoUploadedAt = at;
        LogoUploadedBy = by;
    }

    public void RemoveLogo()
    {
        LogoKey = null;
        LogoFileName = null;
        LogoContentType = null;
        LogoUploadedAt = null;
        LogoUploadedBy = null;
    }

    /// <summary>How often, in days, mentors check in with each youth (L2-125): 7, 14, 21 or 30.</summary>
    public int MentorCheckInDays { get; private set; } = DefaultMentorCheckInDays;

    public const int DefaultMentorCheckInDays = 14;

    public static readonly IReadOnlyList<int> MentorCheckInCadences = [7, 14, 21, 30];

    public void ChangeMentorCheckInDays(int days) => MentorCheckInDays = days;

    /// <summary>Changes the profile kept on Settings › Organization (L2-122, ADR 0073); an empty contact email or phone is null.</summary>
    public void ChangeDetails(string name, string city, string? contactEmail, string? phone, string timeZone)
    {
        Name = name;
        City = city;
        ContactEmail = contactEmail;
        Phone = phone;
        TimeZone = timeZone;
    }

    public void ChangeWebsiteSlug(string slug) => WebsiteSlug = slug;

    /// <summary>One line visitors read under the name on the public website (L2-126); null until written.</summary>
    public string? WebsiteTagline { get; private set; }

    /// <summary>What visitors read about the organization on the public website; optional.</summary>
    public string? WebsiteAbout { get; private set; }

    /// <summary>The email visitors see on the public website; optional.</summary>
    public string? WebsiteEmail { get; private set; }

    public void ChangeWebsiteProfile(string slug, string tagline, string? about, string? email)
    {
        WebsiteSlug = slug;
        WebsiteTagline = tagline;
        WebsiteAbout = about;
        WebsiteEmail = email;
    }

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
