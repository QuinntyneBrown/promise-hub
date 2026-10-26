namespace PromiseHub.Domain.Organizations;

/// <summary>
/// A guardian's request for a copy of the household's data, or its deletion (L2-030 criterion 4). Staff fulfil it once;
/// an export keeps the file it produced.
/// </summary>
public sealed class DataRequest : ITenantOwned
{
    public DataRequest(Guid id, Guid organizationId, Guid householdId, DataRequestKind kind, string email, DateTimeOffset requestedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        Kind = kind;
        Email = email;
        RequestedAt = requestedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public DataRequestKind Kind { get; private set; }
    public string Email { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public DateTimeOffset? FulfilledAt { get; private set; }
    public string? FulfilledBy { get; private set; }
    public string? Export { get; private set; }

    public bool Open => FulfilledAt is null;

    public void Fulfil(string by, DateTimeOffset now, string? export)
    {
        FulfilledBy = by;
        FulfilledAt = now;
        Export = export;
    }
}
