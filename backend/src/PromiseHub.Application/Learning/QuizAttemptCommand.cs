using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Starts or resumes a youth's quiz attempt and saves her answers as she goes (L2-075 criteria 3, 4, 6 and 7, ADR 0055). An attempt is
/// found only by the caller's membership and only while its quiz is visible to her, so another youth's or organization's is not found.
/// </summary>
public sealed class QuizAttemptCommand(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Gated<QuizAttemptDto>> StartAsync(Guid quizId, CancellationToken cancellationToken = default)
    {
        if (await progress.QuizAsync(quizId, cancellationToken) is not { } found)
        {
            return Gated<QuizAttemptDto>.NotFound();
        }
        var (_, module, status) = found;
        if (status.Locked)
        {
            return Gated<QuizAttemptDto>.Locked(status.UnlockAfter);
        }
        var quiz = status.Quiz;
        var attempts = await db.QuizAttempts.Where(a => a.MembershipId == tenant.MembershipId && a.QuizId == quizId).ToListAsync(cancellationToken);
        var attempt = attempts.FirstOrDefault(a => a.Status == AttemptStatus.InProgress);
        if (attempt is null)
        {
            if (quiz.AttemptsAllowed is { } allowed && attempts.Count >= allowed)
            {
                return Gated<QuizAttemptDto>.Conflict("no-attempts");
            }
            var id = Guid.NewGuid();
            var questions = await Questions(quizId, cancellationToken);
            // A shuffled quiz fixes its order for the attempt, seeded by the attempt so a resume shows the same order (ADR 0055).
            var order = quiz.Shuffle ? questions.OrderBy(q => HashCode.Combine(id, q.Id)).ToList() : questions;
            attempt = new QuizAttempt(id, tenant.OrganizationId, tenant.MembershipId, quizId, attempts.Count + 1, string.Join(',', order.Select(q => q.Id)), clock.GetUtcNow());
            db.QuizAttempts.Add(attempt);
            audit.Record(new AuditEvent(AuditAction.Created, "QuizAttempt", attempt.Id, $"{quiz.Title} attempt {attempt.Number} started by {tenant.ActorName}"));
            await db.SaveChangesAsync(cancellationToken);
        }
        var ordered = await Ordered(attempt, cancellationToken);
        return Gated<QuizAttemptDto>.Found(new QuizAttemptDto(attempt.Id, quiz.Id, quiz.Title, module.Module.Id, module.Module.Title, attempt.Number, quiz.AttemptsAllowed,
            Math.Clamp(attempt.Position, 0, Math.Max(0, ordered.Count - 1)),
            ordered.Select(q => new AttemptQuestionDto(q.Id, q.Text, q.Type.ToString(), q.Options is null ? [] : q.Options.Split('\n'))).ToList(),
            QuizAnswers.Read(attempt.Answers)));
    }

    public async Task<Gated<bool>> SaveAsync(Guid attemptId, SaveAnswersRequest request, CancellationToken cancellationToken = default)
    {
        var (attempt, error) = await OwnAsync(attemptId, cancellationToken);
        if (attempt is null)
        {
            return error!;
        }
        var questions = await Questions(attempt.QuizId, cancellationToken);
        var answers = request.Answers ?? [];
        if (Check(questions, answers) is { } errors)
        {
            return Gated<bool>.Invalid(errors);
        }
        attempt.Save(QuizAnswers.Write(answers), Math.Clamp(request.Position, 0, Math.Max(0, questions.Count - 1)));
        await db.SaveChangesAsync(cancellationToken);
        return Gated<bool>.Found(true);
    }

    /// <summary>The caller's own attempt in progress while its quiz is visible and unlocked; otherwise why not.</summary>
    private async Task<(QuizAttempt? Attempt, Gated<bool>? Error)> OwnAsync(Guid attemptId, CancellationToken cancellationToken)
    {
        var attempt = await db.QuizAttempts.FirstOrDefaultAsync(a => a.Id == attemptId && a.MembershipId == tenant.MembershipId, cancellationToken);
        if (attempt is null || await progress.QuizAsync(attempt.QuizId, cancellationToken) is not { } found)
        {
            return (null, Gated<bool>.NotFound());
        }
        if (found.Quiz.Locked)
        {
            return (null, Gated<bool>.Locked(found.Quiz.UnlockAfter));
        }
        return attempt.Submitted ? (null, Gated<bool>.Conflict("submitted")) : (attempt, null);
    }

    /// <summary>Each answer must be to a question of the quiz: one option for multiple choice or true / false, options in range, short text.</summary>
    private static Dictionary<string, string>? Check(IReadOnlyList<QuizQuestion> questions, IReadOnlyList<QuizAnswer> answers)
    {
        foreach (var answer in answers)
        {
            var question = questions.FirstOrDefault(q => q.Id == answer.QuestionId);
            if (question is null)
            {
                return new() { ["answers"] = "Answer only questions of this quiz." };
            }
            var choices = answer.Choices ?? [];
            var options = question.Options is null ? 0 : question.Options.Split('\n').Length;
            if (choices.Any(c => c < 0 || c >= options))
            {
                return new() { ["answers"] = "Choose one of the options." };
            }
            if (question.Type is QuestionType.MultipleChoice or QuestionType.TrueFalse && choices.Count > 1)
            {
                return new() { ["answers"] = "Choose one answer." };
            }
            if (answer.Text is { Length: > QuizAttempt.MaximumTextAnswer })
            {
                return new() { ["answers"] = "Keep your answer under 200 characters." };
            }
        }
        return answers.Select(a => a.QuestionId).Distinct().Count() == answers.Count ? null : new() { ["answers"] = "Answer each question once." };
    }

    private async Task<List<QuizQuestion>> Questions(Guid quizId, CancellationToken cancellationToken) =>
        await db.QuizQuestions.AsNoTracking().Where(q => q.QuizId == quizId).OrderBy(q => q.Position).ToListAsync(cancellationToken);

    /// <summary>The quiz's current questions in the attempt's order; questions added since come last and deleted ones drop out.</summary>
    private async Task<List<QuizQuestion>> Ordered(QuizAttempt attempt, CancellationToken cancellationToken)
    {
        var questions = await Questions(attempt.QuizId, cancellationToken);
        var order = attempt.QuestionOrder.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Guid.Parse).ToList();
        return [.. questions.Where(q => order.Contains(q.Id)).OrderBy(q => order.IndexOf(q.Id)), .. questions.Where(q => !order.Contains(q.Id))];
    }
}
