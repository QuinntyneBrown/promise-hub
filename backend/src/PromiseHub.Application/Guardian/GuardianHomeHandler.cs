using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
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
public sealed class GuardianHomeHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, NoShowReplyHandler replies, ApprovedPickupsHandler pickups, PickupRequestHandler requests, GuardianContactChange contactChange, IAuditWriter audit, TimeProvider clock)
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
                    pickupsOn ? [.. pickups.Where(p => p.ChildId == child.Id).Select(p => new GuardianHomePickupDto(p.Id, p.Name, p.Relationship))] : null,
                    child.Allergies, child.Medication);
            })],
            noShows,
            [.. waiting.OrderBy(r => r.RequestedAt).Select(r => new GuardianHomePickupRequestDto(r.Id, children.First(c => c.Id == r.ChildId).FirstName, r.CollectorName, eventNames.GetValueOrDefault(r.EventId, ""), r.RequestedAt))],
            primary is null ? null : new GuardianHomeContactDto(primary.Name, primary.Mobile, primary.Email, scope.Household.Language)));
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

    /// <summary>
    /// The primary guardian corrects their mobile, email and the household's language (L2-011 criterion 7). A changed mobile
    /// ends every link and trusted device of the household, so new links go to the new number (L2-026 criterion 4).
    /// </summary>
    public async Task<GuardianResult> UpdateHouseholdAsync(GuardianRequest request, UpdateHouseholdRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await TrustedScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var mobile = string.IsNullOrWhiteSpace(body.Mobile) ? null : body.Mobile.Trim();
        var email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim();
        var errors = new Dictionary<string, string>();
        if (mobile is not null && ContactMask.Digits(mobile).Length != 10)
        {
            errors["mobile"] = "Enter a ten-digit mobile number.";
        }
        if (email is not null && (!email.Contains('@', StringComparison.Ordinal) || !email.Split('@')[^1].Contains('.', StringComparison.Ordinal)))
        {
            errors["email"] = "Enter an email like name@example.com.";
        }
        if (mobile is null && email is null)
        {
            errors["mobile"] = "Leave a mobile number or an email so we can reach you.";
        }
        if (body.Language is null || !Households.HouseholdRules.Languages.Contains(body.Language))
        {
            errors["language"] = "Choose English, Spanish or French.";
        }
        if (errors.Count > 0)
        {
            return new GuardianResult(GuardianOutcome.Invalid, Errors: errors);
        }
        var guardian = await db.Guardians.Where(g => g.HouseholdId == scope!.Household.Id).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstAsync(cancellationToken);
        var household = await db.Households.SingleAsync(h => h.Id == scope!.Household.Id, cancellationToken);
        var before = new { guardian.Mobile, guardian.Email, household.Language };
        guardian.UpdateContact(mobile, email, body.Language!);
        household.ChangeLanguage(body.Language!);
        audit.Record(new AuditEvent(AuditAction.Updated, "Guardian", guardian.Id, $"{guardian.Name} · contact details updated by the guardian", before, new { guardian.Mobile, guardian.Email, household.Language }));
        if (before.Mobile != guardian.Mobile)
        {
            await contactChange.RevokeAsync(household.Id, cancellationToken);
        }
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    /// <summary>A guardian corrects a child's allergies and medication from the family page; staff see it on the Quick Card at once.</summary>
    public async Task<GuardianResult> UpdateMedicalAsync(GuardianRequest request, Guid childId, UpdateMedicalRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await TrustedScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var child = await db.Children.FirstOrDefaultAsync(c => c.Id == childId && c.HouseholdId == scope!.Household.Id, cancellationToken);
        if (child is null)
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        var name = await GuardianNameAsync(scope!, cancellationToken);
        var before = new { child.Allergies, child.Medication };
        var current = child.Medical;
        child.UpdateMedical(current with
        {
            Allergies = string.IsNullOrWhiteSpace(body.Allergies) ? null : body.Allergies.Trim(),
            Medication = string.IsNullOrWhiteSpace(body.Medication) ? null : body.Medication.Trim(),
        }, name, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, "Child", child.Id, $"{child.FullName} · medical details updated by the guardian ({name})", before, new { child.Allergies, child.Medication }));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    private async Task<(GuardianResult? Problem, GuardianScope? Scope)> TrustedScopeAsync(GuardianRequest request, CancellationToken cancellationToken)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization)), null);
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        if (!scope.Trusted)
        {
            return (GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, [])), null);
        }
        return (null, scope);
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
