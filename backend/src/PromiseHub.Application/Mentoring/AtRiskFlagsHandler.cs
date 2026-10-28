using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Mentoring;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// At-risk flags (L2-091, ADR 0062): a mentor raises one on a youth in his scope (404 outside the organization, 403 audited outside his scope,
/// 422 by field, 409 when the youth already has an open flag), audited as Created without the reason. A mentor reads the flags on youth in his
/// scope; admins and program directors read every flag of the organization.
/// </summary>
public sealed class AtRiskFlagsHandler(IPromiseHubDb db, ITenantContext tenant, MentorScope scope, IAuditWriter audit, TimeProvider clock)
{
    public const string Resolved = "Resolved";

    private bool IsMentor => RolePermissions.Has(tenant.Role, Permission.MentorYouth);

    public async Task<AtRiskFlagsDto> ListAsync(string? status, CancellationToken cancellationToken = default)
    {
        var query = db.AtRiskFlags.AsNoTracking();
        IReadOnlyList<YouthOptionDto> youth = [];
        if (IsMentor)
        {
            var youthIds = await scope.YouthIdsAsync(cancellationToken);
            query = query.Where(f => youthIds.Contains(f.ChildId));
            youth = await db.Children.AsNoTracking().Where(c => youthIds.Contains(c.Id))
                .Select(c => new YouthOptionDto(c.Id, c.FirstName + " " + c.LastName)).ToListAsync(cancellationToken);
            youth = [.. youth.OrderBy(y => y.Name, StringComparer.Ordinal)];
        }
        var rows = await query.ToListAsync(cancellationToken);
        var resolved = string.Equals(status, Resolved, StringComparison.OrdinalIgnoreCase);
        var shown = resolved
            ? rows.Where(f => !f.IsOpen).OrderByDescending(f => f.ResolvedAt)
            : rows.Where(f => f.IsOpen).OrderByDescending(f => f.Severity).ThenByDescending(f => f.RaisedAt);
        var items = await ToDtosAsync([.. shown], cancellationToken);
        return new AtRiskFlagsDto(items, rows.Count(f => f.IsOpen), rows.Count(f => !f.IsOpen), youth, IsMentor);
    }

    public async Task<FlagWriteResult> RaiseAsync(RaiseFlagRequest request, CancellationToken cancellationToken = default)
    {
        if (!IsMentor)
        {
            return new(Result.Forbidden);
        }
        var errors = new Dictionary<string, string>();
        if (request.ChildId is not { } childId)
        {
            errors["childId"] = "Choose a youth.";
            childId = Guid.Empty;
        }
        else if (await RefuseAsync(childId, cancellationToken) is { } refused)
        {
            return new(refused);
        }
        if (!TryParse<AtRiskFlagSeverity>(request.Severity, out var severity))
        {
            errors["severity"] = "Choose how serious it is.";
        }
        var reason = request.Reason?.Trim();
        if (string.IsNullOrEmpty(reason))
        {
            errors["reason"] = "Say why you’re worried.";
        }
        else if (reason.Length > AtRiskFlag.MaximumText)
        {
            errors["reason"] = "Keep it to 1,000 characters.";
        }
        if (errors.Count > 0)
        {
            return new(Result.Invalid(errors));
        }
        if (await db.AtRiskFlags.AnyAsync(f => f.ChildId == childId && f.ResolvedAt == null, cancellationToken))
        {
            return new(Result.Conflict, Code: "already-flagged");
        }
        var child = await db.Children.AsNoTracking().FirstAsync(c => c.Id == childId, cancellationToken);
        var flag = new AtRiskFlag(Guid.NewGuid(), tenant.OrganizationId, childId, tenant.MembershipId, severity, reason!, clock.GetUtcNow());
        db.AtRiskFlags.Add(flag);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(AtRiskFlag), flag.Id, $"At-risk flag on {child.FullName} by {tenant.ActorName}",
            After: new { Severity = severity.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return new(Result.Created(flag.Id), (await ToDtosAsync([flag], cancellationToken))[0]);
    }

    private async Task<IReadOnlyList<AtRiskFlagDto>> ToDtosAsync(IReadOnlyList<AtRiskFlag> flags, CancellationToken cancellationToken)
    {
        var childIds = flags.Select(f => f.ChildId).Distinct().ToList();
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id))
            .Select(c => new { c.Id, Name = c.FirstName + " " + c.LastName }).ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);
        var memberIds = flags.Select(f => f.RaisedByMembershipId).Concat(flags.Where(f => f.ResolvedByMembershipId != null)
            .Select(f => f.ResolvedByMembershipId!.Value)).Distinct().ToList();
        var people = await db.Memberships.AsNoTracking().Where(m => memberIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, m => m.PersonName, cancellationToken);
        return [.. flags.Select(f => new AtRiskFlagDto(f.Id, f.ChildId, children[f.ChildId], f.Severity.ToString(), f.Reason,
            people.GetValueOrDefault(f.RaisedByMembershipId, "Former staff"), f.RaisedAt, f.IsOpen ? "Open" : Resolved, f.Outcome?.ToString(),
            f.ResolutionNote, f.ResolvedByMembershipId is { } by ? people.GetValueOrDefault(by, "Former staff") : null, f.ResolvedAt))];
    }

    private async Task<Result?> RefuseAsync(Guid childId, CancellationToken cancellationToken)
    {
        if (!await db.Children.AsNoTracking().AnyAsync(c => c.Id == childId, cancellationToken))
        {
            return Result.NotFound;
        }
        if (!await scope.CanSeeYouthAsync(childId, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", childId, "At-risk flag outside the mentor’s youth"));
            await db.SaveChangesAsync(cancellationToken);
            return Result.Forbidden;
        }
        return null;
    }

    private static bool TryParse<T>(string? value, out T parsed) where T : struct, Enum =>
        Enum.TryParse(value, out parsed) && Enum.IsDefined(parsed) && !int.TryParse(value, out _);
}
