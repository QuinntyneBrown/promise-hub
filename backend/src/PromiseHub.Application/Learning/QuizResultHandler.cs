using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The caller's own submitted attempt (L2-076 criteria 1 to 4 and 6): its score and pass, attempts left and her best score, and a review
/// only as the quiz's feedback rule allows; an attempt waiting for approval shows none of them. An attempt in progress, another youth's
/// or one whose quiz she can no longer see is not found.
/// </summary>
public sealed class QuizResultHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress)
{
    public async Task<Gated<QuizResultDto>> HandleAsync(Guid attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await db.QuizAttempts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == attemptId && a.MembershipId == tenant.MembershipId, cancellationToken);
        if (attempt is not { Submitted: true } || await progress.QuizAsync(attempt.QuizId, cancellationToken) is not { } found)
        {
            return Gated<QuizResultDto>.NotFound();
        }
        var (_, module, status) = found;
        var quiz = status.Quiz;
        var mine = await db.QuizAttempts.AsNoTracking().Where(a => a.MembershipId == tenant.MembershipId && a.QuizId == quiz.Id).ToListAsync(cancellationToken);
        var used = mine.Count(a => a.Submitted);
        int? left = quiz.AttemptsAllowed is { } allowed ? Math.Max(0, allowed - used) : null;
        var awaiting = attempt.Status == AttemptStatus.AwaitingApproval;
        var reveal = !awaiting && (quiz.Feedback == FeedbackMode.ShowAnswers || (quiz.Feedback == FeedbackMode.AfterLastAttempt && left == 0));
        var review = reveal ? await ReviewAsync(attempt, cancellationToken) : [];
        var canRetake = mine.Any(a => a.Status == AttemptStatus.InProgress) || left is null || left > 0;
        return Gated<QuizResultDto>.Found(new QuizResultDto(attempt.Id, quiz.Id, quiz.Title, module.Module.Id, module.Module.Title, attempt.Number, quiz.AttemptsAllowed,
            used, left, awaiting ? "awaiting-approval" : "scored", attempt.SubmittedAt,
            awaiting ? null : attempt.Score, awaiting ? null : attempt.Correct, awaiting ? null : attempt.Total, quiz.PassMark, awaiting ? null : attempt.Passed,
            status.BestScore, canRetake, quiz.Feedback.ToString(), review));
    }

    private async Task<IReadOnlyList<ReviewQuestionDto>> ReviewAsync(QuizAttempt attempt, CancellationToken cancellationToken)
    {
        var ordered = AttemptOrder.Apply(attempt, await db.QuizQuestions.AsNoTracking().Where(q => q.QuizId == attempt.QuizId).ToListAsync(cancellationToken));
        var answers = QuizAnswers.Read(attempt.Answers);
        return ordered.Select((q, i) =>
        {
            var answer = answers.FirstOrDefault(a => a.QuestionId == q.Id);
            var shortAnswer = q.Type == QuestionType.ShortAnswer;
            return new ReviewQuestionDto(q.Id, i + 1, q.Text, q.Type.ToString(), q.Options is null ? [] : q.Options.Split('\n'),
                answer?.Choices?.Order().ToList() ?? [], answer?.Text, shortAnswer ? [] : QuizScoring.CorrectOptions(q),
                shortAnswer ? QuizScoring.Accepted(q) : [], QuizScoring.IsRight(q, answer));
        }).ToList();
    }
}
