using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Learning;

/// <summary>
/// What the signed-in youth may see and open (L2-068, ADR 0051). Visible: Published content of a Published track followed by an
/// active, non-archived program the youth's child is enrolled in, in the caller's organization. A module is locked while its
/// prerequisite is Published and not done; a lesson while its module is locked or an earlier published lesson is not done.
/// Every youth read and write asks here, so the locks hold on the server.
/// </summary>
public sealed class LearnerProgress(IPromiseHubDb db, ITenantContext tenant)
{
    private Guid? _membership;

    /// <summary>The youth whose progress is read: the caller, unless a guardian's page reads it for the youth's membership (ADR 0067).</summary>
    private Guid MembershipId => _membership ?? tenant.MembershipId;

    /// <summary>The same reads for another youth membership of the caller's organization, as the guardian portal shows them (L2-102 criterion 4).</summary>
    public LearnerProgress ForMembership(Guid membershipId) => new(db, tenant) { _membership = membershipId };

    public async Task<IReadOnlyList<TrackStatus>> TracksAsync(CancellationToken cancellationToken = default)
    {
        var followed = await FollowedAsync(cancellationToken);
        var result = new List<TrackStatus>();
        foreach (var (track, program) in followed)
        {
            result.Add(await BuildAsync(track, program, cancellationToken));
        }
        return result;
    }

    public async Task<TrackStatus?> TrackAsync(Guid trackId, CancellationToken cancellationToken = default)
    {
        var match = (await FollowedAsync(cancellationToken)).FirstOrDefault(f => f.Track.Id == trackId);
        return match.Track is null ? null : await BuildAsync(match.Track, match.Program, cancellationToken);
    }

    /// <summary>The visible module with its track, or null when it is not visible.</summary>
    public async Task<(TrackStatus Track, ModuleStatus Module)?> ModuleAsync(Guid moduleId, CancellationToken cancellationToken = default)
    {
        var trackId = await db.CurriculumModules.AsNoTracking().Where(m => m.Id == moduleId).Select(m => (Guid?)m.TrackId).FirstOrDefaultAsync(cancellationToken);
        var track = trackId is { } id ? await TrackAsync(id, cancellationToken) : null;
        var module = track?.Modules.FirstOrDefault(m => m.Module.Id == moduleId);
        return module is null ? null : (track!, module);
    }

    /// <summary>The visible lesson with its module and track, or null when it is not visible.</summary>
    public async Task<(TrackStatus Track, ModuleStatus Module, LessonStatus Lesson)?> LessonAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        var moduleId = await db.Lessons.AsNoTracking().Where(l => l.Id == lessonId).Select(l => (Guid?)l.ModuleId).FirstOrDefaultAsync(cancellationToken);
        var found = moduleId is { } id ? await ModuleAsync(id, cancellationToken) : null;
        var lesson = found?.Module.Lessons.FirstOrDefault(l => l.Lesson.Id == lessonId);
        return lesson is null ? null : (found!.Value.Track, found.Value.Module, lesson);
    }

    private async Task<List<(Track Track, string Program)>> FollowedAsync(CancellationToken cancellationToken)
    {
        var childId = await db.Memberships.AsNoTracking()
            .Where(m => m.Id == MembershipId && m.OrganizationId == tenant.OrganizationId)
            .Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        if (childId is not { } child)
        {
            return [];
        }
        var rows = await (from e in db.Enrollments.AsNoTracking()
                          join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                          join t in db.Tracks.AsNoTracking() on p.TrackId equals t.Id
                          where e.ChildId == child && e.EndedAt == null && p.Status != ProgramStatus.Archived && t.Status == ContentStatus.Published
                                && e.OrganizationId == tenant.OrganizationId && p.OrganizationId == tenant.OrganizationId && t.OrganizationId == tenant.OrganizationId
                          select new { Track = t, p.Name, p.StartsOn }).ToListAsync(cancellationToken);
        return rows.OrderBy(r => r.StartsOn).ThenBy(r => r.Name).GroupBy(r => r.Track.Id).Select(g => (g.First().Track, g.First().Name)).ToList();
    }

    private async Task<TrackStatus> BuildAsync(Track track, string program, CancellationToken cancellationToken)
    {
        var modules = await db.CurriculumModules.AsNoTracking().Where(m => m.TrackId == track.Id).ToListAsync(cancellationToken);
        var moduleIds = modules.Select(m => m.Id).ToList();
        var lessons = await db.Lessons.AsNoTracking()
            .Where(l => moduleIds.Contains(l.ModuleId) && l.Status == ContentStatus.Published && l.DeletedAt == null)
            .ToListAsync(cancellationToken);
        var lessonIds = lessons.Select(l => l.Id).ToList();
        var done = (await db.LessonProgress.AsNoTracking()
            .Where(p => p.MembershipId == MembershipId && lessonIds.Contains(p.LessonId))
            .Select(p => p.LessonId).ToListAsync(cancellationToken)).ToHashSet();
        var quizzes = (await db.Quizzes.AsNoTracking()
            .Where(q => moduleIds.Contains(q.ModuleId) && q.Status == ContentStatus.Published).ToListAsync(cancellationToken))
            .Where(q => q.LessonId is null || lessonIds.Contains(q.LessonId.Value)).ToList();
        var quizIds = quizzes.Select(q => q.Id).ToList();
        var questionCounts = (await db.QuizQuestions.AsNoTracking().Where(q => quizIds.Contains(q.QuizId)).Select(q => q.QuizId).ToListAsync(cancellationToken))
            .GroupBy(id => id).ToDictionary(g => g.Key, g => g.Count());
        var attempts = (await db.QuizAttempts.AsNoTracking()
            .Where(a => a.MembershipId == MembershipId && quizIds.Contains(a.QuizId))
            .Select(a => new { a.QuizId, a.Status, a.Score }).ToListAsync(cancellationToken)).ToLookup(a => a.QuizId);

        var assignments = (await db.Assignments.AsNoTracking()
            .Where(a => moduleIds.Contains(a.ModuleId) && a.Status == ContentStatus.Published).ToListAsync(cancellationToken))
            .Where(a => a.LessonId is null || lessonIds.Contains(a.LessonId.Value)).ToList();
        var assignmentIds = assignments.Select(a => a.Id).ToList();
        var submissions = (await db.AssignmentSubmissions.AsNoTracking()
            .Where(x => x.MembershipId == MembershipId && assignmentIds.Contains(x.AssignmentId))
            .Select(x => new { x.Id, x.AssignmentId, x.Status }).ToListAsync(cancellationToken)).ToDictionary(x => x.AssignmentId);

        int? Best(Guid quizId) => attempts[quizId].Where(a => a.Status == AttemptStatus.Scored).Max(a => a.Score);

        bool ModuleDone(Guid id) => lessons.Where(l => l.ModuleId == id).All(l => done.Contains(l.Id))
            && quizzes.Where(q => q.ModuleId == id && q.RequiredToComplete).All(q => Best(q.Id) is { } best && best >= q.PassMark);

        var result = new List<ModuleStatus>();
        var position = 0;
        foreach (var module in modules.Where(m => m.Status == ContentStatus.Published).OrderBy(m => m.Position))
        {
            position++;
            var prerequisite = module.PrerequisiteModuleId is { } pid ? modules.FirstOrDefault(m => m.Id == pid) : null;
            var locked = prerequisite is { Status: ContentStatus.Published } && !ModuleDone(prerequisite.Id);
            var unlock = locked ? prerequisite!.Title : null;
            var items = new List<LessonStatus>();
            string? firstNotDone = null;
            foreach (var lesson in lessons.Where(l => l.ModuleId == module.Id).OrderBy(l => l.Position))
            {
                var isDone = done.Contains(lesson.Id);
                var lessonLocked = !isDone && (locked || firstNotDone is not null);
                items.Add(new LessonStatus(lesson, isDone, lessonLocked, lessonLocked ? (locked ? unlock : firstNotDone) : null));
                if (!isDone && firstNotDone is null)
                {
                    firstNotDone = lesson.Title;
                }
            }
            var quizStatuses = new List<QuizStatus>();
            foreach (var quiz in quizzes.Where(q => q.ModuleId == module.Id).OrderBy(q => q.LessonId is null ? 1 : 0)
                         .ThenBy(q => lessons.FirstOrDefault(l => l.Id == q.LessonId)?.Position ?? 0).ThenBy(q => q.Title))
            {
                // A lesson quiz waits for its lesson; a whole-module quiz for every lesson of the module (ADR 0055).
                var waitFor = quiz.LessonId is { } lid ? (done.Contains(lid) ? null : lessons.First(l => l.Id == lid).Title) : firstNotDone;
                var quizLocked = locked || waitFor is not null;
                var mine = attempts[quiz.Id].ToList();
                quizStatuses.Add(new QuizStatus(quiz, questionCounts.GetValueOrDefault(quiz.Id), quizLocked, quizLocked ? (locked ? unlock : waitFor) : null, Best(quiz.Id),
                    mine.Any(a => a.Status == AttemptStatus.InProgress), mine.Any(a => a.Status == AttemptStatus.AwaitingApproval), mine.Any(a => a.Status == AttemptStatus.Scored)));
            }
            var assignmentStatuses = new List<AssignmentStatus>();
            foreach (var assignment in assignments.Where(a => a.ModuleId == module.Id).OrderBy(a => a.LessonId is null ? 1 : 0)
                         .ThenBy(a => lessons.FirstOrDefault(l => l.Id == a.LessonId)?.Position ?? 0).ThenBy(a => a.Title))
            {
                // A lesson assignment waits for its lesson; a whole-module assignment only for the module (ADR 0056).
                var waitFor = assignment.LessonId is { } lid && !done.Contains(lid) ? lessons.First(l => l.Id == lid).Title : null;
                var assignmentLocked = locked || waitFor is not null;
                var sent = submissions.GetValueOrDefault(assignment.Id);
                assignmentStatuses.Add(new AssignmentStatus(assignment, assignmentLocked, assignmentLocked ? (locked ? unlock : waitFor) : null, sent?.Id, sent?.Status.ToString()));
            }
            result.Add(new ModuleStatus(module, position, items, locked, unlock, quizStatuses, assignmentStatuses));
        }
        return new TrackStatus(track, program, result);
    }

    /// <summary>The visible assignment with its module and track, or null when it is not visible (draft, lesson not published, track not followed).</summary>
    public async Task<(TrackStatus Track, ModuleStatus Module, AssignmentStatus Assignment)?> AssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        var moduleId = await db.Assignments.AsNoTracking().Where(a => a.Id == assignmentId).Select(a => (Guid?)a.ModuleId).FirstOrDefaultAsync(cancellationToken);
        var found = moduleId is { } id ? await ModuleAsync(id, cancellationToken) : null;
        var assignment = found?.Module.Assignments.FirstOrDefault(a => a.Assignment.Id == assignmentId);
        return assignment is null ? null : (found!.Value.Track, found.Value.Module, assignment);
    }

    /// <summary>The visible quiz with its module and track, or null when it is not visible (draft, lesson not published, track not followed).</summary>
    public async Task<(TrackStatus Track, ModuleStatus Module, QuizStatus Quiz)?> QuizAsync(Guid quizId, CancellationToken cancellationToken = default)
    {
        var moduleId = await db.Quizzes.AsNoTracking().Where(q => q.Id == quizId).Select(q => (Guid?)q.ModuleId).FirstOrDefaultAsync(cancellationToken);
        var found = moduleId is { } id ? await ModuleAsync(id, cancellationToken) : null;
        var quiz = found?.Module.Quizzes.FirstOrDefault(q => q.Quiz.Id == quizId);
        return quiz is null ? null : (found!.Value.Track, found.Value.Module, quiz);
    }
}
