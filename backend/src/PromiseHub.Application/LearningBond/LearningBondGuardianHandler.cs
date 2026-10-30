using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Opens a Learning Bond guardian link (L2-162 criterion 6): the tenant comes from the link, then the module gate decides. An unknown or
/// revoked link, a suspended organization and the module off all answer null, so the endpoint's 404 never confirms which it was.
/// </summary>
public sealed class LearningBondGuardianHandler(GuardianAccess access, TenantContext tenant, IModuleGate modules, IAuditWriter audit, IPromiseHubDb db)
{
    public async Task<LearningBondGuardianDto?> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null)
        {
            return null;
        }
        tenant.ResolveForGuardian(scope.Organization.Id);
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "LearningBondLink", scope.Link.Id, "Learning Bond link opened while Learning Bond is off"));
            await db.SaveChangesAsync(cancellationToken);
            return null;
        }
        return new LearningBondGuardianDto(scope.Organization.Name, GuardianLanguage.Code(scope.Household.Language));
    }
}
