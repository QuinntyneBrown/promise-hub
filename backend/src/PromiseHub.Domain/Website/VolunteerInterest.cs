using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Website;

/// <summary>An offer to volunteer from an organization's public website, with the screening acknowledgement it was given with (L2-134 criterion 2).</summary>
public sealed class VolunteerInterest : ITenantOwned
{
    public const int MaximumPhone = 30;
    public const int MaximumAbout = 1000;

    public VolunteerInterest(Guid id, Guid organizationId, string name, string email, string? phone, string area, string? about, bool screeningAcknowledged,
        DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        Email = email;
        Phone = phone;
        Area = area;
        About = about;
        ScreeningAcknowledged = screeningAcknowledged;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string? Phone { get; private set; }
    public string Area { get; private set; }
    public string? About { get; private set; }
    public bool ScreeningAcknowledged { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
