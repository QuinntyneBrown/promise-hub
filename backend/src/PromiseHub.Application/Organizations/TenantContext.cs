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

    /// <summary>
    /// An anonymous visitor of one organization's public website (ADR 0075): the organization comes from the website address, the one place
    /// a tenant is chosen without a membership, so every later query of the request runs inside the ordinary tenant filter.
    /// </summary>
    public void ResolveForVisitor(Guid organizationId)
    {
        OrganizationId = organizationId;
        ActorName = "Website visitor";
        IsResolved = true;
    }

    /// <summary>A background job whose actions the audit attributes to "System" (L2-161), such as destroying a SIN.</summary>
    public void ResolveForSystem(Guid organizationId)
    {
        OrganizationId = organizationId;
        ActorName = "System";
        IsResolved = true;
    }

    /// <summary>A guardian acting through a link (L2-161): the organization comes from the link and the audit names the actor "Guardian".</summary>
    public void ResolveForGuardian(Guid organizationId)
    {
        OrganizationId = organizationId;
        ActorName = "Guardian";
        IsResolved = true;
    }

    /// <summary>
    /// A named signer acting through an emailed link (L2-137, ADR 0078): the organization comes from the link and the audit names the actor
    /// "Signer: {name}", since the signer has no membership.
    /// </summary>
    public void ResolveForSigner(Guid organizationId, string name)
    {
        OrganizationId = organizationId;
        ActorName = $"Signer: {name}";
        IsResolved = true;
    }

    public static TenantContext System() => new() { IsSystem = true, ActorName = "System" };
}
