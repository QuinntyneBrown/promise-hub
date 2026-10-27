using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The review queue (L2-080 criterion 1, L2-081 criterion 1, ADR 0057): the Submitted or In review assignment submissions and the quiz
/// attempts awaiting approval of the mentor's youth accounts, oldest first. Nothing of another mentor's youth is read.
/// </summary>
public sealed class ReviewQueueHandler(IPromiseHubDb db, MentorYouthMemberships youth)
{
    public async Task<ReviewQueueDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var names = await youth.ReadAsync(cancellationToken);
        var ids = names.Keys.ToList();
        var submissions = await (
            from s in db.AssignmentSubmissions.AsNoTracking()
            where ids.Contains(s.MembershipId) && (s.Status == SubmissionStatus.Submitted || s.Status == SubmissionStatus.InReview)
            join a in db.Assignments.AsNoTracking() on s.AssignmentId equals a.Id
            join m in db.CurriculumModules.AsNoTracking() on a.ModuleId equals m.Id
            select new { s.Id, s.MembershipId, a.Title, Module = m.Title, s.SubmittedAt, s.Late, s.Status }).ToListAsync(cancellationToken);
        var attempts = await (
            from t in db.QuizAttempts.AsNoTracking()
            where ids.Contains(t.MembershipId) && t.Status == AttemptStatus.AwaitingApproval
            join q in db.Quizzes.AsNoTracking() on t.QuizId equals q.Id
            join m in db.CurriculumModules.AsNoTracking() on q.ModuleId equals m.Id
            select new { t.Id, t.MembershipId, q.Title, Module = m.Title, t.SubmittedAt, t.Score }).ToListAsync(cancellationToken);
        var items = submissions
            .Select(s => new ReviewItemDto(s.Id, "Assignment", s.MembershipId, names[s.MembershipId], s.Title, s.Module, s.SubmittedAt, s.Late, s.Status.ToString(), null))
            .Concat(attempts.Select(t => new ReviewItemDto(t.Id, "Quiz", t.MembershipId, names[t.MembershipId], t.Title, t.Module, t.SubmittedAt!.Value, false, "AwaitingApproval", t.Score)))
            .OrderBy(i => i.SubmittedAt)
            .ToList();
        return new ReviewQueueDto(items);
    }
}
