using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>The organization and role resolved on the server from the active membership, for one request or one job run.</summary>
public interface ITenantContext
{
    bool IsResolved { get; }
    Guid OrganizationId { get; }
    Guid MembershipId { get; }
    string ActorName { get; }
    Role Role { get; }

    /// <summary>True only for the CLI seeder, which writes rows for every organization.</summary>
    bool IsSystem { get; }
}
