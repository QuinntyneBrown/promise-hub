using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Enrollment;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Enrollment;

/// <summary>
/// Resolves a program's enrollment link to its program and organization and puts the request in that organization's scope;
/// the Roster module must be on (L2-001, L2-005). The device cookie finds the guardian's verified session.
/// </summary>
public sealed class EnrollmentLink(IPromiseHubDb db, TenantContext tenant, IModuleGate modules)
{
    public async Task<(Domain.Programs.Program Program, Organization Organization)?> ResolveAsync(string slug, CancellationToken cancellationToken)
    {
        var program = await db.Programs.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.EnrollmentSlug == slug, cancellationToken);
        if (program is null)
        {
            return null;
        }
        tenant.ResolveForJob(program.OrganizationId);
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken))
        {
            return null;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == program.OrganizationId, cancellationToken);
        return (program, organization);
    }

    public async Task<EnrollmentSession?> SessionAsync(Guid programId, string? deviceToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(deviceToken))
        {
            return null;
        }
        var hash = GuardianTokens.Hash(deviceToken);
        return await db.EnrollmentSessions.FirstOrDefaultAsync(s => s.ProgramId == programId && s.TokenHash == hash, cancellationToken);
    }
}
