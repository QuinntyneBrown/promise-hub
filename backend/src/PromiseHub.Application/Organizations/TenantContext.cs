using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

public sealed class TenantContext : ITenantContext
{
    public bool IsResolved { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public string ActorName { get; private set; } = string.Empty;
    public Role Role { get; private set; }
    public bool IsSystem { get; private init; }

    public void Resolve(Membership membership)
    {
        OrganizationId = membership.OrganizationId;
        MembershipId = membership.Id;
        ActorName = membership.PersonName;
        Role = membership.Role;
        IsResolved = true;
    }

    /// <summary>A background job acting for one organization, never for a person.</summary>
    public void ResolveForJob(Guid organizationId)
    {
        OrganizationId = organizationId;
        ActorName = "PromiseHub";
        IsResolved = true;
    }

    public static TenantContext System() => new() { IsSystem = true, ActorName = "System" };
}
