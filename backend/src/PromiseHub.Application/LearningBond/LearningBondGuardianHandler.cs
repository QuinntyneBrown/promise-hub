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
    LearningBondStaffNotifier staff, LearningBondGuardianScope guardianScope, LearningBondFamilyChildren familyChildren, TimeProvider clock)
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
    public const string NoticeKind = LearningBondStaffNotifier.Kind;

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
        await staff.NotifyAsync($"{guardian ?? $"The {scope.Household.Name} household"} asked for a call about Learning Bond · {phone} · {when.ToString().ToLowerInvariant()}.",
            "/learning-bond/families?status=CallRequested", cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return new(ResultStatus.Done, $"{scope.Organization.Name} will call you. They will see where you are in the steps, never your SIN.");
    }

    /// <summary>
    /// The guardian's Learning Bond page (L2-144): an unknown or revoked link has expired; with the module off, not found; a device not verified
    /// for the household gets the code step and nothing about the children; a verified one gets the children and the agent's fixed line.
    /// </summary>
    public async Task<GuardianResult> PageAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var code = GuardianLanguage.Code(scope!.Household.Language);
        var children = await familyChildren.ForAsync(scope.Household.Id, scope.Organization.TimeZone, cancellationToken);
        var invitation = await LatestInvitationAsync(scope.Household.Id, cancellationToken);
        var started = await db.LearningBondClaims.AsNoTracking().AnyAsync(c => c.HouseholdId == scope.Household.Id, cancellationToken);
        var status = started ? LearningBondFamilyStatus.Started
            : invitation is null ? LearningBondFamilyStatus.NotInvited
            : invitation.DeclinedAt is not null ? LearningBondFamilyStatus.NotInterested : LearningBondFamilyStatus.Invited;
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianLearningBondDto(code, scope.Organization.Name, scope.Organization.Phone,
            AgentFallbackCopy.Welcome(code, scope.Organization.Name), children, status.ToString(), await ConsentsAsync(scope.Household.Id, cancellationToken)));
    }

    /// <summary>Your consents (L2-152 criterion 1): each consent in force, with the provider of the child's latest application.</summary>
    private async Task<IReadOnlyList<GuardianLearningBondConsentDto>> ConsentsAsync(Guid householdId, CancellationToken cancellationToken)
    {
        var consents = (await db.LearningBondConsents.AsNoTracking().Where(c => c.HouseholdId == householdId && c.Scope == LearningBondConsentScope.LearningBond
            && c.WithdrawnAt == null && c.ClosedAt == null).ToListAsync(cancellationToken)).OrderBy(c => c.GivenAt).ToList();
        var childIds = consents.Select(c => c.ChildId).ToList();
        var names = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.FirstName, cancellationToken);
        var applications = (await db.LearningBondApplications.AsNoTracking().Where(a => a.HouseholdId == householdId).ToListAsync(cancellationToken))
            .Where(a => a.Status != LearningBondApplicationStatus.Cancelled).ToList();
        return [.. consents.Select(c =>
        {
            var latest = applications.Where(a => a.ChildId == c.ChildId).OrderByDescending(a => a.CreatedAt).FirstOrDefault();
            return new GuardianLearningBondConsentDto(c.Id, c.ChildId, names.GetValueOrDefault(c.ChildId, string.Empty), c.TypedName, c.GivenAt, c.WordingVersion,
                latest?.Provider, latest?.SubmittedAt is not null);
        })];
    }

    /// <summary>Not now changes nothing; I'm not interested marks the household's invitation declined, audited (L2-144 criterion 4).</summary>
    public async Task<GuardianResult> ChooseAsync(GuardianRequest request, LearningBondChoiceRequest choice, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        switch (choice.Choice)
        {
            case "NotNow":
                return GuardianResult.Of(GuardianOutcome.Done);
            case "NotInterested":
                if (await LatestInvitationAsync(scope!.Household.Id, cancellationToken, tracked: true) is { } invitation && invitation.DeclinedAt is null)
                {
                    invitation.Decline(clock.GetUtcNow());
                    audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondInvitation), scope.Household.Id,
                        $"The {scope.Household.Name} household isn’t interested in the Learning Bond"));
                    await db.SaveChangesAsync(cancellationToken);
                }
                return GuardianResult.Of(GuardianOutcome.Done);
            default:
                return GuardianResult.Invalid("choice", "Choose Not now or I’m not interested.");
        }
    }

    private async Task<LearningBondInvitation?> LatestInvitationAsync(Guid householdId, CancellationToken cancellationToken, bool tracked = false)
    {
        var query = tracked ? db.LearningBondInvitations : db.LearningBondInvitations.AsNoTracking();
        return (await query.Where(i => i.HouseholdId == householdId).ToListAsync(cancellationToken)).OrderByDescending(i => i.SentAt).FirstOrDefault();
    }
}
