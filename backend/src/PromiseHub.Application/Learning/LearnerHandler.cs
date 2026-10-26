using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>A youth's own record (L2-007 criterion 9): only the child linked to the caller's membership, never another.</summary>
public sealed class LearnerHandler(ITenantContext tenant)
{
    public Task<LearnerDto> HandleAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new LearnerDto(tenant.ActorName, null));
}
