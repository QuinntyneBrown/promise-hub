using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Notifications;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Mentoring;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// Assign work (L2-092, ADR 0063): a mentor is offered the published lessons, quizzes and assignments of the tracks his youth follow, his youth
/// and his cohorts, and assigns one item to chosen youth in his scope or to a cohort he is on, with a due date and an optional message. 404 for
/// an item, child or cohort outside the organization; 403 audited outside his scope; 422 by field; every recipient follows the item's track.
/// One row per youth and item; audited once as Created without the message.
/// </summary>
public sealed class AssignWorkHandler(IPromiseHubDb db, ITenantContext tenant, MentorScope scope, IAuditWriter audit, OrganizationToday today,
    TimeProvider clock, NotificationWriter notifications)
{
    public async Task<AssignWorkOptionsDto> OptionsAsync(CancellationToken cancellationToken = default)
    {
        var youthIds = await scope.YouthIdsAsync(cancellationToken);
        var following = await FollowingAsync(youthIds, cancellationToken);
        var trackIds = following.Where(f => f.TrackId != null).Select(f => f.TrackId!.Value).Distinct().ToList();
        var items = (await ItemsAsync(trackIds, cancellationToken)).Where(i => i.Published)
            .OrderBy(i => i.TrackName, StringComparer.Ordinal).ThenBy(i => i.ModulePosition).ThenBy(i => i.Kind).ThenBy(i => i.Position).ThenBy(i => i.Title, StringComparer.Ordinal)
            .Select(i => new AssignWorkItemDto(i.Id, i.Kind.ToString(), i.Title, i.ModuleTitle, i.TrackId, i.TrackName)).ToList();
        var publishedTracks = items.Select(i => i.TrackId).ToHashSet();
        var flagged = (await db.AtRiskFlags.AsNoTracking().Where(f => youthIds.Contains(f.ChildId) && f.ResolvedAt == null)
            .Select(f => f.ChildId).ToListAsync(cancellationToken)).ToHashSet();
        var children = await db.Children.AsNoTracking().Where(c => youthIds.Contains(c.Id))
            .Select(c => new { c.Id, Name = c.FirstName + " " + c.LastName }).ToListAsync(cancellationToken);
        var youth = children.OrderBy(c => c.Name, StringComparer.Ordinal).Select(c =>
        {
            var mine = following.Where(f => f.ChildId == c.Id).ToList();
            return new AssignWorkYouthDto(c.Id, c.Name, string.Join(", ", mine.Select(f => f.ProgramName).Distinct().Order(StringComparer.Ordinal)),
                [.. mine.Where(f => f.TrackId is { } t && publishedTracks.Contains(t)).Select(f => f.TrackId!.Value).Distinct()], flagged.Contains(c.Id));
        }).ToList();
        var cohortIds = (await scope.CohortsAsync(cancellationToken)).Select(c => c.ProgramId).ToList();
        var rosters = await db.Enrollments.AsNoTracking().Where(e => cohortIds.Contains(e.ProgramId) && e.EndedAt == null)
            .GroupBy(e => e.ProgramId).Select(g => new { ProgramId = g.Key, Count = g.Count() }).ToDictionaryAsync(g => g.ProgramId, g => g.Count, cancellationToken);
        var cohorts = (await db.Programs.AsNoTracking().Where(p => cohortIds.Contains(p.Id)).ToListAsync(cancellationToken))
            .Where(p => rosters.GetValueOrDefault(p.Id) > 0).OrderBy(p => p.Name, StringComparer.Ordinal)
            .Select(p => new AssignWorkCohortDto(p.Id, p.Name, rosters[p.Id], p.TrackId)).ToList();
        return new AssignWorkOptionsDto(items, youth, cohorts);
    }

    public async Task<(Result Result, AssignedWorkResultDto? Assigned)> AssignAsync(AssignWorkRequest request, CancellationToken cancellationToken = default)
    {
        // Existence first: anything outside the organization is not found (L2-092 criterion 7).
        AssignableItem? item = null;
        if (request.ItemId is { } itemId && itemId != Guid.Empty)
        {
            item = await ItemAsync(itemId, cancellationToken);
            if (item is null)
            {
                return (Result.NotFound, null);
            }
        }
        var childIds = (request.ChildIds ?? []).Distinct().ToList();
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToListAsync(cancellationToken);
        if (children.Count != childIds.Count)
        {
            return (Result.NotFound, null);
        }
        Domain.Programs.Program? cohort = null;
        if (request.ProgramId is { } programId)
        {
            cohort = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
            if (cohort is null)
            {
                return (Result.NotFound, null);
            }
        }

        // Then scope: his youth and his cohorts only, refusals audited.
        var youthIds = await scope.YouthIdsAsync(cancellationToken);
        if (children.FirstOrDefault(c => !youthIds.Contains(c.Id)) is { } outside)
        {
            return (await DeniedAsync("Child", outside.Id, "Assigning work to a child outside the mentor’s youth", cancellationToken), null);
        }
        if (cohort is not null && !(await scope.CohortsAsync(cancellationToken)).Any(c => c.ProgramId == cohort.Id))
        {
            return (await DeniedAsync("Program", cohort.Id, "Assigning work to a cohort the mentor is not on", cancellationToken), null);
        }

        // Then the fields (criterion 3).
        var errors = new Dictionary<string, string>();
        var kindOk = Enum.TryParse<AssignedWorkKind>(request.Kind, out var kind) && Enum.IsDefined(kind) && !int.TryParse(request.Kind, out _);
        if (item is null || !kindOk || item.Kind != kind || !item.Published)
        {
            errors["itemId"] = "Choose what to assign.";
        }
        if ((childIds.Count > 0) == (cohort is not null))
        {
            errors["who"] = "Choose who it’s for.";
        }
        var dueOn = DateOnly.TryParseExact(request.DueOn, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : (DateOnly?)null;
        if (dueOn is null)
        {
            errors["dueOn"] = "Choose a due date.";
        }
        else if (dueOn < await today.GetAsync(cancellationToken))
        {
            errors["dueOn"] = "The due date can’t be in the past.";
        }
        var message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim();
        if (message?.Length > AssignedWork.MaximumMessage)
        {
            errors["message"] = "Keep it to 500 characters.";
        }
        if (errors.Count > 0)
        {
            return (Result.Invalid(errors), null);
        }

        // Every recipient follows the item's track.
        var noun = kind.ToString().ToLowerInvariant();
        List<Guid> recipients;
        if (cohort is not null)
        {
            if (cohort.TrackId != item!.TrackId)
            {
                return (Result.Invalid(new Dictionary<string, string> { ["programId"] = $"{cohort.Name} doesn’t follow the track this {noun} is in." }), null);
            }
            recipients = await db.Enrollments.AsNoTracking().Where(e => e.ProgramId == cohort.Id && e.EndedAt == null).Select(e => e.ChildId).Distinct().ToListAsync(cancellationToken);
            if (recipients.Count == 0)
            {
                return (Result.Invalid(new Dictionary<string, string> { ["programId"] = "That cohort has no youth on its roster." }), null);
            }
        }
        else
        {
            var following = await FollowingAsync(childIds, cancellationToken);
            if (children.OrderBy(c => c.FullName, StringComparer.Ordinal).FirstOrDefault(c => !following.Any(f => f.ChildId == c.Id && f.TrackId == item!.TrackId)) is { } stray)
            {
                return (Result.Invalid(new Dictionary<string, string> { ["childIds"] = $"{stray.FullName} doesn’t follow the track this {noun} is in." }), null);
            }
            recipients = childIds;
        }

        var now = clock.GetUtcNow();
        var existing = await db.AssignedWork.Where(w => recipients.Contains(w.ChildId) && w.Kind == kind && w.ItemId == item!.Id).ToListAsync(cancellationToken);
        foreach (var childId in recipients)
        {
            if (existing.FirstOrDefault(w => w.ChildId == childId) is { } row)
            {
                row.Reassign(cohort?.Id, dueOn!.Value, message, tenant.MembershipId, now);
            }
            else
            {
                db.AssignedWork.Add(new AssignedWork(Guid.NewGuid(), tenant.OrganizationId, childId, kind, item!.Id, cohort?.Id, dueOn!.Value, message, tenant.MembershipId, now));
            }
        }
        var due = dueOn!.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(AssignedWork), item!.Id, $"{tenant.ActorName} assigned {item.Title} to {recipients.Count} youth",
            After: new { Kind = kind.ToString(), DueOn = due, Youth = recipients.Count }));
        // Each recipient's youth account hears of it (L2-109 criterion 1); a child without one has nobody to tell.
        var youthAccounts = await db.Memberships.AsNoTracking()
            .Where(m => m.Role == Domain.Organizations.Role.Youth && m.RemovedAt == null && m.ChildId != null && recipients.Contains(m.ChildId.Value))
            .Select(m => m.Id).ToListAsync(cancellationToken);
        await notifications.NotifyMembersAsync(youthAccounts, "assignments",
            $"{tenant.ActorName} assigned you the {item.Title} {noun}, due {dueOn.Value.ToString("ddd d MMM", CultureInfo.InvariantCulture)}.", "/learning", cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, new AssignedWorkResultDto(recipients.Count, item.Title, due));
    }

    private async Task<Result> DeniedAsync(string recordType, Guid id, string summary, CancellationToken cancellationToken)
    {
        audit.Record(new AuditEvent(AuditAction.AccessDenied, recordType, id, summary));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Forbidden;
    }

    /// <summary>Each youth's active enrollments in programs that are not archived, with the track each follows.</summary>
    private async Task<List<Following>> FollowingAsync(IReadOnlyCollection<Guid> childIds, CancellationToken cancellationToken) =>
        await (from e in db.Enrollments.AsNoTracking()
               join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
               where childIds.Contains(e.ChildId) && e.EndedAt == null && p.Status != ProgramStatus.Archived
               select new Following(e.ChildId, p.Name, p.TrackId)).ToListAsync(cancellationToken);

    private async Task<AssignableItem?> ItemAsync(Guid id, CancellationToken cancellationToken)
    {
        var moduleId = await db.Lessons.AsNoTracking().Where(l => l.Id == id).Select(l => (Guid?)l.ModuleId).FirstOrDefaultAsync(cancellationToken)
            ?? await db.Quizzes.AsNoTracking().Where(q => q.Id == id).Select(q => (Guid?)q.ModuleId).FirstOrDefaultAsync(cancellationToken)
            ?? await db.Assignments.AsNoTracking().Where(a => a.Id == id).Select(a => (Guid?)a.ModuleId).FirstOrDefaultAsync(cancellationToken);
        if (moduleId is null)
        {
            return null;
        }
        var trackId = await db.CurriculumModules.AsNoTracking().Where(m => m.Id == moduleId).Select(m => m.TrackId).FirstAsync(cancellationToken);
        return (await ItemsAsync([trackId], cancellationToken)).FirstOrDefault(i => i.Id == id);
    }

    /// <summary>Every lesson, quiz and assignment of the tracks, published all the way up or not.</summary>
    private async Task<List<AssignableItem>> ItemsAsync(IReadOnlyCollection<Guid> trackIds, CancellationToken cancellationToken)
    {
        var tracks = await db.Tracks.AsNoTracking().Where(t => trackIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, cancellationToken);
        var modules = await db.CurriculumModules.AsNoTracking().Where(m => trackIds.Contains(m.TrackId)).ToDictionaryAsync(m => m.Id, cancellationToken);
        var moduleIds = modules.Keys.ToList();
        var lessons = await db.Lessons.AsNoTracking().Where(l => moduleIds.Contains(l.ModuleId)).ToListAsync(cancellationToken);
        var quizzes = await db.Quizzes.AsNoTracking().Where(q => moduleIds.Contains(q.ModuleId)).ToListAsync(cancellationToken);
        var assignments = await db.Assignments.AsNoTracking().Where(a => moduleIds.Contains(a.ModuleId)).ToListAsync(cancellationToken);
        var lessonOpen = lessons.ToDictionary(l => l.Id, l => l.Status == ContentStatus.Published && l.DeletedAt == null);

        bool Up(Guid moduleId) => modules[moduleId].Status == ContentStatus.Published && tracks[modules[moduleId].TrackId].Status == ContentStatus.Published;
        bool Attached(Guid? lessonId) => lessonId is not { } l || lessonOpen.GetValueOrDefault(l);
        AssignableItem Make(Guid id, AssignedWorkKind kind, string title, Guid moduleId, int position, bool published)
        {
            var module = modules[moduleId];
            var track = tracks[module.TrackId];
            return new AssignableItem(id, kind, title, moduleId, module.Title, module.Position, position, track.Id, track.Name, published && Up(moduleId));
        }

        return
        [
            .. lessons.Select(l => Make(l.Id, AssignedWorkKind.Lesson, l.Title, l.ModuleId, l.Position, lessonOpen[l.Id])),
            .. quizzes.Select(q => Make(q.Id, AssignedWorkKind.Quiz, q.Title, q.ModuleId, 0, q.Status == ContentStatus.Published && Attached(q.LessonId))),
            .. assignments.Select(a => Make(a.Id, AssignedWorkKind.Assignment, a.Title, a.ModuleId, 0, a.Status == ContentStatus.Published && Attached(a.LessonId))),
        ];
    }

    private sealed record Following(Guid ChildId, string ProgramName, Guid? TrackId);
}
