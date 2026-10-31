using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Mentoring;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Launch (L2-140, ADR 0079): how the covered households can be reached, the households to collect a contact from, and the launch itself,
/// on a day at 10:00 in the organization's time zone or at the door. A household is reached by text when a guardian has a mobile number,
/// by email when none has a mobile but one has an email that hasn't bounced. A scheduled launch is a due row the dispatch runner sends.
/// </summary>
public sealed class LearningBondLaunchHandler(IPromiseHubDb db, LearningBondCoverage coverage, LearningBondAgreementGate gate, OrganizationToday today,
    LearningBondSettingsHandler settings, LearningBondInvitationSender sender, IModuleGate modules, IAuditWriter audit, TimeProvider clock)
{
    public const int LatestDays = 90;
    public const string DateMessage = "Choose a date from tomorrow to 90 days ahead.";
    public const string NoPhoneNumbersMessage = "Add guardians’ mobile numbers before launching. Staff can collect them at check-in.";
    public const string LaunchedMessage = "Learning Bond has launched. Staff invite new families at the door.";
    public static readonly TimeOnly SendsAt = new(10, 0);

    public async Task<LearningBondLaunchDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var reach = await ReachAsync(cancellationToken);
        var programs = reach.SelectMany(r => r.Programs).Distinct().Order(StringComparer.CurrentCulture).ToList();
        var on = await today.GetAsync(cancellationToken);
        var mobile = reach.Count(r => r.Reach == Reach.Mobile);
        var row = await db.LearningBondSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        return new LearningBondLaunchDto(reach.Count, mobile, reach.Count(r => r.Reach == Reach.EmailOnly), reach.Count(r => r.Reach == Reach.Neither), programs,
            mobile == 0, row?.LaunchMode?.ToString(), row?.LaunchDate, row?.LaunchedAt, on.AddDays(1), on.AddDays(LatestDays),
            await gate.IsAcceptedAsync(cancellationToken) ? null : LearningBondOverviewHandler.NewVersionMessage);
    }

    public async Task<LearningBondMissingContactsDto> MissingContactsAsync(CancellationToken cancellationToken = default)
    {
        var reach = await ReachAsync(cancellationToken);
        var neither = reach.Where(r => r.Reach == Reach.Neither).ToList();
        var ids = neither.Select(r => r.HouseholdId).ToList();
        var names = await db.Households.AsNoTracking().Where(h => ids.Contains(h.Id)).ToDictionaryAsync(h => h.Id, h => h.Name, cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        return new([.. neither.Select(r => new LearningBondMissingContactDto(r.HouseholdId, names[r.HouseholdId],
            guardians.Where(g => g.HouseholdId == r.HouseholdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture).FirstOrDefault()?.Name,
            string.Join(", ", r.Programs)))]);
    }

    /// <summary>
    /// Schedules the launch for a day from tomorrow to 90 days ahead, or chooses At the door (criteria 2 to 4): refused while a new agreement
    /// version waits, with no mobile number on any covered household, or once a scheduled launch has sent.
    /// </summary>
    public async Task<Result> ScheduleAsync(ScheduleLaunchRequest request, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<LearningBondLaunchMode>(request.Mode, out var mode) || !Enum.IsDefined(mode))
        {
            return Invalid("mode", "Choose a day or Staff invite at the door.");
        }
        var row = await settings.RowAsync(cancellationToken);
        if (row.LaunchedAt is not null)
        {
            return Invalid("launch", LaunchedMessage);
        }
        if (mode == LearningBondLaunchMode.Scheduled && await DateErrorAsync(request.Date, cancellationToken) is { } invalid)
        {
            return invalid;
        }
        if (!await gate.IsAcceptedAsync(cancellationToken))
        {
            return Invalid("launch", LearningBondOverviewHandler.NewVersionMessage);
        }
        if (mode == LearningBondLaunchMode.Scheduled && (await ReachAsync(cancellationToken)).All(r => r.Reach != Reach.Mobile))
        {
            return Invalid("launch", NoPhoneNumbersMessage);
        }
        row.ChooseLaunch(mode, request.Date, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSettings), row.Id, mode == LearningBondLaunchMode.Scheduled
            ? $"Learning Bond launch scheduled for {Day(request.Date!.Value)}"
            : "Learning Bond launch: staff invite at the door"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(row.Id);
    }

    /// <summary>Moves a scheduled launch that hasn't sent (criterion 6).</summary>
    public async Task<Result> MoveAsync(MoveLaunchRequest request, CancellationToken cancellationToken = default)
    {
        if (await db.LearningBondSettings.FirstOrDefaultAsync(cancellationToken) is not { LaunchPending: true } row)
        {
            return Result.NotFound;
        }
        if (await DateErrorAsync(request.Date, cancellationToken) is { } invalid)
        {
            return invalid;
        }
        row.MoveLaunch(request.Date!.Value, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSettings), row.Id, $"Learning Bond launch moved to {Day(request.Date.Value)}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>Cancels a launch that hasn't sent: nothing goes out (criterion 6).</summary>
    public async Task<Result> CancelAsync(CancellationToken cancellationToken = default)
    {
        if (await db.LearningBondSettings.FirstOrDefaultAsync(cancellationToken) is not { LaunchMode: not null, LaunchedAt: null } row)
        {
            return Result.NotFound;
        }
        row.CancelLaunch(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSettings), row.Id, "Learning Bond launch cancelled; nothing was sent"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>
    /// The dispatch runner's step for one organization (criteria 3, 5 and 7): once a scheduled launch's day has come and it is 10:00 there,
    /// queues one invitation per covered household not invited in the last 7 days, marks the launch sent and audits the count, in one save.
    /// Nothing is sent while Learning Bond is off; the runner already skips a suspended organization.
    /// </summary>
    public async Task SendDueAsync(CancellationToken cancellationToken = default)
    {
        if (await db.LearningBondSettings.FirstOrDefaultAsync(cancellationToken) is not { LaunchPending: true, LaunchDate: { } date } row
            || !await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return;
        }
        var local = await today.NowAsync(cancellationToken);
        if (local.DateTime < date.ToDateTime(SendsAt))
        {
            return;
        }
        var invited = await sender.QueueAsync(await coverage.CoveredAsync(cancellationToken), LearningBondLaunchMode.Scheduled, cancellationToken);
        row.MarkLaunched(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondInvitation), row.Id,
            $"Learning Bond invitations sent to {invited.Count} {(invited.Count == 1 ? "household" : "households")}"));
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<Result?> DateErrorAsync(DateOnly? date, CancellationToken cancellationToken)
    {
        var on = await today.GetAsync(cancellationToken);
        return date is { } d && d > on && d <= on.AddDays(LatestDays) ? null : Invalid("date", DateMessage);
    }

    private static Result Invalid(string field, string message) => Result.Invalid(new Dictionary<string, string> { [field] = message });

    private static string Day(DateOnly date) => date.ToString("ddd d MMM yyyy", CultureInfo.InvariantCulture);

    /// <summary>Each covered household, the programs that cover it, and how it can be reached.</summary>
    private async Task<List<(Guid HouseholdId, IReadOnlyList<string> Programs, Reach Reach)>> ReachAsync(CancellationToken cancellationToken)
    {
        var covered = await coverage.CoveredAsync(cancellationToken);
        var ids = covered.Select(c => c.HouseholdId).ToList();
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        return [.. covered.Select(c => (c.HouseholdId, c.Programs, ReachOf(guardians.Where(g => g.HouseholdId == c.HouseholdId))))];
    }

    private static Reach ReachOf(IEnumerable<Domain.Households.Guardian> guardians)
    {
        var list = guardians.ToList();
        if (list.Any(g => !string.IsNullOrWhiteSpace(g.Mobile)))
        {
            return Reach.Mobile;
        }
        return list.Any(g => !string.IsNullOrWhiteSpace(g.Email) && !g.EmailBounced) ? Reach.EmailOnly : Reach.Neither;
    }

    private enum Reach
    {
        Mobile,
        EmailOnly,
        Neither,
    }
}
