using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Attendance;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Enrollment;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// The household's home page, opened from a decision text (L2-013 criterion 12): each child's programs with the status, the
/// waitlist position and the note staff wrote. The household comes from the link; a new device verifies with a code first.
/// </summary>
public sealed class GuardianHomeHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, NoShowReplyHandler replies, ApprovedPickupsHandler pickups, PickupRequestHandler requests, TimeProvider clock)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null)
        {
            return GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization));
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
        if (!scope.Trusted)
        {
            var contacts = guardians.Where(g => g.Mobile is not null).Select(g => ContactMask.Phone(g.Mobile!))
                .Concat(guardians.Where(g => g.Email is not null && !g.EmailBounced).Select(g => ContactMask.Email(g.Email!))).ToList();
            return GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, contacts));
        }
        var children = await db.Children.AsNoTracking().Where(c => c.HouseholdId == scope.Household.Id).OrderBy(c => c.FirstName).ToListAsync(cancellationToken);
        var ids = children.Select(c => c.Id).ToList();
        var requests = await db.EnrollmentRequests.AsNoTracking().Where(r => ids.Contains(r.ChildId)).ToListAsync(cancellationToken);
        var rosters = await db.Enrollments.AsNoTracking().Where(e => ids.Contains(e.ChildId) && e.EndedAt == null).ToListAsync(cancellationToken);
        var programIds = requests.Select(r => r.ProgramId).Concat(rosters.Select(e => e.ProgramId)).Distinct().ToList();
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, cancellationToken);
        var primary = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
        var pickupsOn = await modules.IsOnAsync(ModuleId.Pickup, cancellationToken);
        var pickups = pickupsOn ? await db.ApprovedPickups.AsNoTracking().Where(p => ids.Contains(p.ChildId) && p.RemovedAt == null).OrderBy(p => p.Name).ToListAsync(cancellationToken) : [];
        var waiting = pickupsOn ? await db.PickupRequests.AsNoTracking().Where(r => r.HouseholdId == scope.Household.Id && r.Status == PickupRequestStatus.Pending).ToListAsync(cancellationToken) : [];
        var waitingEvents = waiting.Select(r => r.EventId).Distinct().ToList();
        var eventNames = await db.Events.AsNoTracking().Where(e => waitingEvents.Contains(e.Id)).ToDictionaryAsync(e => e.Id, e => e.Name, cancellationToken);
        var noShows = await OpenNoShowsAsync(scope.Household.Id, children.ToDictionary(c => c.Id, c => c.FirstName), cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianHomeDto(
            GuardianLanguage.Code(scope.Household.Language),
            scope.Organization.Name,
            scope.Organization.Phone,
            primary?.Name.Split(' ')[0] ?? string.Empty,
            [.. children.Select(child =>
            {
                var latest = requests.Where(r => r.ChildId == child.Id).GroupBy(r => r.ProgramId).Select(g => g.OrderByDescending(r => r.SubmittedAt).First()).ToList();
                var enrollments = latest.Select(r => Row(programs[r.ProgramId], r.Status switch
                    {
                        EnrollmentRequestStatus.Accepted => "Enrolled",
                        EnrollmentRequestStatus.Waitlisted => "Waitlisted",
                        EnrollmentRequestStatus.Declined => "Declined",
                        _ => "WaitingReview",
                    }, r.Position, r.Note))
                    .Concat(rosters.Where(e => e.ChildId == child.Id && latest.All(r => r.ProgramId != e.ProgramId)).Select(e => Row(programs[e.ProgramId], "Enrolled", null, null)))
                    .OrderBy(e => e.Program).ToList();
                return new GuardianHomeChildDto(child.FullName, child.FirstName, enrollments, child.Id,
                    pickupsOn ? [.. pickups.Where(p => p.ChildId == child.Id).Select(p => new GuardianHomePickupDto(p.Id, p.Name, p.Relationship))] : null);
            })],
            noShows,
            [.. waiting.OrderBy(r => r.RequestedAt).Select(r => new GuardianHomePickupRequestDto(r.Id, children.First(c => c.Id == r.ChildId).FirstName, r.CollectorName, eventNames.GetValueOrDefault(r.EventId, ""), r.RequestedAt))]));
    }

    /// <summary>Answers a no-show text from the page instead of replying 1 or 2 (L2-018 criterion 8).</summary>
    public async Task<GuardianResult> AnswerNoShowAsync(GuardianRequest request, AnswerNoShowRequest body, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null)
        {
            return GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization));
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken) || !await modules.IsOnAsync(ModuleId.RollCall, cancellationToken))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        if (!scope.Trusted)
        {
            return GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, []));
        }
        if (body.Reply == NoShowReply.None)
        {
            return GuardianResult.Invalid("reply", "Choose on the way or absent.");
        }
        return await replies.ApplyAsync(body.EventId, scope.Household.Id, body.Reply, cancellationToken)
            ? GuardianResult.Of(GuardianOutcome.Done)
            : GuardianResult.Of(GuardianOutcome.NotFound);
    }

    /// <summary>Adds an approved adult for one of the household's own children from the family page (L2-020 criterion 5).</summary>
    public async Task<(GuardianResult? Problem, Result? Done)> AddPickupAsync(GuardianRequest request, Guid childId, AddPickupCommand body, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await PickupScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return (problem, null);
        }
        return (null, await pickups.AddAsync(childId, body, true, await GuardianNameAsync(scope!, cancellationToken), scope!.Household.Id, cancellationToken));
    }

    public async Task<(GuardianResult? Problem, Result? Done)> RemovePickupAsync(GuardianRequest request, Guid childId, Guid pickupId, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await PickupScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return (problem, null);
        }
        return (null, await pickups.RemoveAsync(childId, pickupId, true, await GuardianNameAsync(scope!, cancellationToken), scope!.Household.Id, cancellationToken));
    }

    /// <summary>The guardian approves or refuses someone waiting to collect their child (L2-020 criterion 7).</summary>
    public async Task<GuardianResult> DecidePickupAsync(GuardianRequest request, Guid requestId, DecidePickupRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await PickupScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        return await requests.DecideAsync(requestId, scope!.Household.Id, body.Approve, await GuardianNameAsync(scope, cancellationToken), cancellationToken)
            ? GuardianResult.Of(GuardianOutcome.Done)
            : GuardianResult.Of(GuardianOutcome.NotFound);
    }

    private async Task<(GuardianResult? Problem, GuardianScope? Scope)> PickupScopeAsync(GuardianRequest request, CancellationToken cancellationToken)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization)), null);
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken) || !await modules.IsOnAsync(ModuleId.Pickup, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        if (!scope.Trusted)
        {
            return (GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, [])), null);
        }
        return (null, scope);
    }

    private async Task<string> GuardianNameAsync(GuardianScope scope, CancellationToken cancellationToken) =>
        await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).OrderByDescending(g => g.IsPrimary).Select(g => g.Name).FirstOrDefaultAsync(cancellationToken) ?? "A guardian";

    private async Task<IReadOnlyList<GuardianHomeNoShowDto>> OpenNoShowsAsync(Guid householdId, Dictionary<Guid, string> names, CancellationToken cancellationToken)
    {
        if (!await modules.IsOnAsync(ModuleId.RollCall, cancellationToken))
        {
            return [];
        }
        var since = clock.GetUtcNow() - NoShowRules.ReplyWindow;
        var open = (await db.NoShowAlerts.AsNoTracking().Where(a => a.HouseholdId == householdId && a.Reply == NoShowReply.None).ToListAsync(cancellationToken))
            .Where(a => a.SentAt > since).ToList();
        var eventIds = open.Select(a => a.EventId).Distinct().ToList();
        var events = await db.Events.AsNoTracking().Where(e => eventIds.Contains(e.Id)).ToListAsync(cancellationToken);
        return [.. events.OrderBy(e => e.StartsAt).Select(e => new GuardianHomeNoShowDto(e.Id, e.Name, e.StartsAt,
            [.. open.Where(a => a.EventId == e.Id).Select(a => names.GetValueOrDefault(a.ChildId, "")).OrderBy(n => n)]))];
    }

    private static GuardianHomeEnrollmentDto Row(Domain.Programs.Program program, string status, int? position, string? note) =>
        new(program.Name, status, position, note, program.StartsOn, program.Schedule);
}
