using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Households;

public sealed class Household : ITenantOwned, ISoftDeletable
{
    public Household(Guid id, Guid organizationId, string name, string language)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        Language = language;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }

    /// <summary>The language messages to this household are sent in.</summary>
    public string Language { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }
    public DateTimeOffset? PurgeAfter { get; private set; }

    public void ChangeLanguage(string language) => Language = language;

    public void SoftDelete(DateTimeOffset now, TimeSpan retention)
    {
        DeletedAt = now;
        PurgeAfter = now + retention;
    }
}
