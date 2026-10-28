using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Mentoring;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Mentoring;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The Learning home (L2-068 criterion 1). While Mentoring is on it also lists the work assigned to her (L2-092 criterion 5, ADR 0063): her
/// rows whose item she can still open, not yet done (a lesson completed, a quiz scored or awaiting approval, an assignment handed in), soonest
/// due first.
/// </summary>
public sealed class LearningHomeHandler(LearnerProgress progress, IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, OrganizationToday today)
{
    public async Task<LearningHomeDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await progress.TracksAsync(cancellationToken);
        var next = tracks.Select(t => t.Next).FirstOrDefault(n => n is not null);
        return new LearningHomeDto(
            tracks.Sum(t => t.Done),
            tracks.Sum(t => t.Total),
            next is { } n ? new NextLessonDto(n.Lesson.Lesson.Id, n.Lesson.Lesson.Kind.ToString(), n.Lesson.Lesson.Title, n.Module.Module.Id, n.Module.Module.Title,
                n.Lesson.Lesson.Reading, n.Lesson.Lesson.Minutes, n.Module.Done, n.Module.Lessons.Count) : null,
            tracks.Select(t => new TrackSummaryDto(t.Track.Id, t.Track.Name, t.Track.Description, t.Program, t.Done, t.Total)).ToList(),
            await AssignedAsync(tracks, cancellationToken));
    }

    private async Task<IReadOnlyList<AssignedWorkItemDto>> AssignedAsync(IReadOnlyList<TrackStatus> tracks, CancellationToken cancellationToken)
    {
        if (!await modules.IsOnAsync(ModuleId.Mentoring, cancellationToken))
        {
            return [];
        }
        var childId = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        if (childId is not { } child)
        {
            return [];
        }
        var rows = await db.AssignedWork.AsNoTracking().Where(w => w.ChildId == child).ToListAsync(cancellationToken);
        if (rows.Count == 0)
        {
            return [];
        }
        // What is still open to her and not done, by item: its title and module.
        var open = new Dictionary<(AssignedWorkKind, Guid), (string Title, string Module, string? LessonKind)>();
        foreach (var module in tracks.SelectMany(t => t.Modules))
        {
            foreach (var l in module.Lessons.Where(l => !l.Done))
            {
                open[(AssignedWorkKind.Lesson, l.Lesson.Id)] = (l.Lesson.Title, module.Module.Title, l.Lesson.Kind.ToString());
            }
            foreach (var q in module.Quizzes.Where(q => !q.Attempted && !q.Awaiting))
            {
                open[(AssignedWorkKind.Quiz, q.Quiz.Id)] = (q.Quiz.Title, module.Module.Title, null);
            }
            foreach (var a in module.Assignments.Where(a => a.SubmissionId is null))
            {
                open[(AssignedWorkKind.Assignment, a.Assignment.Id)] = (a.Assignment.Title, module.Module.Title, null);
            }
        }
        var by = rows.Select(w => w.AssignedByMembershipId).Distinct().ToList();
        var names = await db.Memberships.AsNoTracking().Where(m => by.Contains(m.Id)).ToDictionaryAsync(m => m.Id, m => m.PersonName, cancellationToken);
        var day = await today.GetAsync(cancellationToken);
        return [.. rows.Where(w => open.ContainsKey((w.Kind, w.ItemId)))
            .OrderBy(w => w.DueOn).ThenBy(w => open[(w.Kind, w.ItemId)].Title, StringComparer.Ordinal)
            .Select(w =>
            {
                var item = open[(w.Kind, w.ItemId)];
                return new AssignedWorkItemDto(w.Kind.ToString(), w.ItemId, item.LessonKind, item.Title, item.Module,
                    w.DueOn.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), w.DueOn.DayNumber - day.DayNumber,
                    names.GetValueOrDefault(w.AssignedByMembershipId, "Former staff"), w.Message);
            })];
    }
}
