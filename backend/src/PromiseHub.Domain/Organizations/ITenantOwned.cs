namespace PromiseHub.Domain.Organizations;

/// <summary>Marks an entity that belongs to exactly one organization (tenant).</summary>
public interface ITenantOwned
{
    Guid OrganizationId { get; }
}
