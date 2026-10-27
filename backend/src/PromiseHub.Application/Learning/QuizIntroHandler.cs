using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>A visible, unlocked quiz's rules and the caller's attempts at it (L2-075 criteria 1, 2 and 7).</summary>
public sealed class QuizIntroHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress)
{
    public async Task<Gated<QuizIntroDto>> HandleAsync(Guid quizId, CancellationToken cancellationToken = default)
    {
        if (await progress.QuizAsync(quizId, cancellationToken) is not { } found)
        {
            return Gated<QuizIntroDto>.NotFound();
        }
        var (_, module, status) = found;
        if (status.Locked)
        {
            return Gated<QuizIntroDto>.Locked(status.UnlockAfter);
        }
        var quiz = status.Quiz;
        var attempts = await db.QuizAttempts.AsNoTracking().Where(a => a.MembershipId == tenant.MembershipId && a.QuizId == quizId)
            .OrderBy(a => a.Number).ToListAsync(cancellationToken);
        var open = attempts.FirstOrDefault(a => a.Status == AttemptStatus.InProgress);
        var submitted = attempts.Where(a => a.Submitted).ToList();
        var best = submitted.Where(a => a.Status == AttemptStatus.Scored).OrderByDescending(a => a.Score).ThenBy(a => a.Number).FirstOrDefault();
        var lessonTitle = quiz.LessonId is { } lid ? module.Lessons.FirstOrDefault(l => l.Lesson.Id == lid)?.Lesson.Title : null;
        var canStart = open is not null || quiz.AttemptsAllowed is not { } allowed || submitted.Count < allowed;
        return Gated<QuizIntroDto>.Found(new QuizIntroDto(quiz.Id, quiz.Title, module.Module.Id, module.Module.Title, lessonTitle, status.QuestionCount,
            quiz.PassMark, quiz.AttemptsAllowed, quiz.Feedback.ToString(), submitted.Count, open?.Number ?? submitted.Count + 1,
            open is null ? null : new InProgressDto(open.Id, open.Number, QuizAnswers.Read(open.Answers).Count(QuizAnswers.Given)),
            best?.Score, status.Passed, best?.Id, submitted.LastOrDefault()?.Id, status.Awaiting, canStart));
    }
}
