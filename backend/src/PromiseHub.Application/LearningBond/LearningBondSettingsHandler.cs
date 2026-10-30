using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Coverage and status roles (L2-138, ADR 0076) on the organization's one settings row. Program ids are read under the tenant filter, so
/// another organization's program is as unknown as one that never existed (criterion 3).
/// </summary>
public sealed class LearningBondSettingsHandler(IPromiseHubDb db, ITenantContext tenant, LearningBondCoverage coverage, IAuditWriter audit, TimeProvider clock)
{
    public const string NoProgramMessage = "Choose at least one program.";
    public const string NotRunningMessage = "Choose programs that are running.";
    public const string RolesMessage = "Choose staff roles that may see status.";
    public const string CoverageMessage = "Choose every program or chosen programs.";

    public async Task<LearningBondSettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var settings = await db.LearningBondSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken) ?? Defaults();
        var (programs, all) = await coverage.CountAsync(cancellationToken);
        return new LearningBondSettingsDto(settings.Coverage.ToString(), settings.Programs, [.. settings.Roles.Select(r => r.ToString())], programs, all);
    }

    public async Task<Result> SaveAsync(SaveLearningBondSettingsRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        if (!Enum.TryParse<LearningBondCoverageMode>(request.Coverage, out var mode) || !Enum.IsDefined(mode))
        {
            errors["coverage"] = CoverageMessage;
        }
        var programIds = request.ProgramIds ?? [];
        if (mode == LearningBondCoverageMode.ChosenPrograms)
        {
            if (programIds.Count == 0)
            {
                errors["programIds"] = NoProgramMessage;
            }
            else
            {
                var running = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id) && p.Status == ProgramStatus.Active).CountAsync(cancellationToken);
                if (running != programIds.Distinct().Count())
                {
                    errors["programIds"] = NotRunningMessage;
                }
            }
        }
        var roles = new List<Role>();
        foreach (var name in request.StatusRoles ?? [])
        {
            if (Enum.TryParse<Role>(name, out var role) && LearningBondSettings.OfferedRoles.Contains(role))
            {
                roles.Add(role);
            }
            else
            {
                errors["statusRoles"] = RolesMessage;
            }
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var settings = await RowAsync(cancellationToken);
        var changed = settings.ChangeCoverage(mode, programIds, roles, clock.GetUtcNow());
        if (changed.Count > 0)
        {
            audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSettings), settings.Id, $"Learning Bond settings changed: {string.Join(", ", changed)}"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>The tenant's row, created on first save.</summary>
    public async Task<LearningBondSettings> RowAsync(CancellationToken cancellationToken = default)
    {
        if (await db.LearningBondSettings.FirstOrDefaultAsync(cancellationToken) is { } settings)
        {
            return settings;
        }
        settings = new LearningBondSettings(Guid.NewGuid(), tenant.OrganizationId, clock.GetUtcNow());
        db.LearningBondSettings.Add(settings);
        return settings;
    }

    private LearningBondSettings Defaults() => new(Guid.Empty, tenant.OrganizationId, clock.GetUtcNow());
}
