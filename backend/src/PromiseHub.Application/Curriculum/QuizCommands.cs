using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Creates quizzes and saves their rules, order and status (L2-073 criteria 1, 4 to 6). Every write is audited.</summary>
public sealed class QuizCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> CreateAsync(CreateQuizCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.CurriculumModules.AnyAsync(m => m.Id == command.ModuleId, cancellationToken))
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        if ((AssessmentRules.CheckTitle(title, "quiz") ?? await AssessmentRules.CheckLessonAsync(db, command.ModuleId, command.LessonId, cancellationToken)) is { } invalid)
        {
            return invalid;
        }
        var quiz = new Quiz(Guid.NewGuid(), tenant.OrganizationId, command.ModuleId, command.LessonId, title!);
        db.Quizzes.Add(quiz);
        audit.Record(new AuditEvent(AuditAction.Created, "Quiz", quiz.Id, title!, After: new { title, command.LessonId }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(quiz.Id);
    }

    public async Task<Result> UpdateAsync(Guid id, SaveQuizCommand command, CancellationToken cancellationToken = default)
    {
        var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null)
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        var errors = new Dictionary<string, string>();
        if (AssessmentRules.CheckTitle(title, "quiz") is { Errors: { } titleErrors })
        {
            errors["title"] = titleErrors["title"];
        }
        if (command.PassMark is < 1 or > 100)
        {
            errors["passMark"] = "Choose a pass mark from 1 to 100%.";
        }
        if (command.AttemptsAllowed is < 1 or > 10)
        {
            errors["attemptsAllowed"] = "Choose 1 to 10 attempts, or unlimited.";
        }
        var feedbackKnown = Enum.TryParse<FeedbackMode>(command.Feedback, out var feedback) && Enum.IsDefined(feedback) && !int.TryParse(command.Feedback, out _);
        if (!feedbackKnown)
        {
            errors["feedback"] = "Choose when youth see the answers.";
        }
        if (await AssessmentRules.CheckLessonAsync(db, quiz.ModuleId, command.LessonId, cancellationToken) is { Errors: { } lessonErrors })
        {
            errors["lessonId"] = lessonErrors["lessonId"];
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var before = new { quiz.Title, quiz.LessonId, quiz.PassMark, quiz.AttemptsAllowed, Feedback = quiz.Feedback.ToString(), quiz.Shuffle, quiz.RequiredToComplete };
        quiz.Update(title!, command.LessonId, command.PassMark, command.AttemptsAllowed, feedback, command.Shuffle, command.RequiredToComplete);
        var after = new { Title = title, command.LessonId, command.PassMark, command.AttemptsAllowed, Feedback = feedback.ToString(), command.Shuffle, command.RequiredToComplete };
        audit.Record(new AuditEvent(AuditAction.Updated, "Quiz", id, title!, before, after));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ReorderAsync(Guid id, IReadOnlyList<Guid>? questionIds, CancellationToken cancellationToken = default)
    {
        var quiz = await db.Quizzes.AsNoTracking().FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null)
        {
            return Result.NotFound;
        }
        var questions = await db.QuizQuestions.Where(q => q.QuizId == id).OrderBy(q => q.Position).ToListAsync(cancellationToken);
        if (!CurriculumRules.IsSameSet(questionIds, questions.Select(q => q.Id).ToList()))
        {
            return CurriculumRules.Invalid("questionIds", "Send every question of the quiz once.");
        }
        var before = questions.Select(q => q.Text).ToList();
        for (var i = 0; i < questionIds!.Count; i++)
        {
            questions.Single(q => q.Id == questionIds[i]).MoveTo(i + 1);
        }
        var after = questionIds.Select(qid => questions.Single(q => q.Id == qid).Text).ToList();
        audit.Record(new AuditEvent(AuditAction.Updated, "Quiz", id, $"Question order · {quiz.Title}", new { Questions = before }, new { Questions = after }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> SetStatusAsync(Guid id, string? status, CancellationToken cancellationToken = default)
    {
        var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null)
        {
            return Result.NotFound;
        }
        if (CurriculumRules.ParseStatus(status, allowReview: false) is not { } next)
        {
            return CurriculumRules.Invalid("status", "Choose Draft or Published.");
        }
        if (next == ContentStatus.Published && !await db.QuizQuestions.AnyAsync(q => q.QuizId == id, cancellationToken))
        {
            return CurriculumRules.Invalid("status", "Add a question before publishing the quiz.");
        }
        var before = quiz.Status.ToString();
        quiz.SetStatus(next);
        audit.Record(new AuditEvent(AuditAction.Updated, "Quiz", id, $"{quiz.Title} · {next}", new { Status = before }, new { Status = next.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
