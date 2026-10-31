using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Notifications;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Opens a Learning Bond guardian link (L2-162 criterion 6): the tenant comes from the link, then the module gate decides. An unknown or
/// revoked link, a suspended organization and the module off all answer null, so the endpoint's 404 never confirms which it was.
/// </summary>
public sealed class LearningBondGuardianHandler(GuardianAccess access, TenantContext tenant, IModuleGate modules, IAuditWriter audit, IPromiseHubDb db,
    NotificationWriter notifications, TimeProvider clock)
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

    public const string PhoneMessage = "Enter a phone number like 905-555-0142.";
    public const string WhenMessage = "Choose a time of day.";
    public const string NoticeKind = "learning-bond";

    /// <summary>
    /// I'd rather talk to someone (L2-142 criterion 3): stores the number and time, so the household's status is Call requested, and tells the
    /// staff in the status roles with the household, the number and the time. Unknown, suspended and off answer the same not-found (criterion 6).
    /// </summary>
    public async Task<LearningBondCallbackOutcome> RequestCallAsync(GuardianRequest link, CallbackRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(link, cancellationToken);
        if (scope is null)
        {
            return new(ResultStatus.NotFound);
        }
        tenant.ResolveForGuardian(scope.Organization.Id);
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return new(ResultStatus.NotFound);
        }
        var phone = request.Phone?.Trim() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        var digits = phone.Count(char.IsAsciiDigit);
        if (digits is < 10 or > 15 || phone.Length > LearningBondCallRequest.MaximumPhone)
        {
            errors["phone"] = PhoneMessage;
        }
        if (!Enum.TryParse<LearningBondCallTime>(request.When, out var when) || !Enum.IsDefined(when))
        {
            errors["when"] = WhenMessage;
        }
        if (errors.Count > 0)
        {
            return new(ResultStatus.Invalid, Errors: errors);
        }
        var guardian = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name)
            .Select(g => g.Name).FirstOrDefaultAsync(cancellationToken);
        db.LearningBondCallRequests.Add(new LearningBondCallRequest(Guid.NewGuid(), scope.Organization.Id, scope.Household.Id, guardian, phone, when, clock.GetUtcNow()));
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondCallRequest), scope.Household.Id, $"Learning Bond call requested by the {scope.Household.Name} household"));
        var roles = (await db.LearningBondSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken))?.Roles ?? LearningBondSettings.FixedRoles;
        var staff = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null).Select(m => new { m.Id, m.Role }).ToListAsync(cancellationToken);
        await notifications.NotifyMembersAsync(staff.Where(m => roles.Contains(m.Role)).Select(m => m.Id), NoticeKind,
            $"{guardian ?? $"The {scope.Household.Name} household"} asked for a call about Learning Bond · {phone} · {when.ToString().ToLowerInvariant()}.",
            "/learning-bond/families?status=CallRequested", cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return new(ResultStatus.Done, $"{scope.Organization.Name} will call you. They will see where you are in the steps, never your SIN.");
    }
}
