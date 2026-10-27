using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Adds, edits and deletes the questions of a quiz (L2-073 criteria 2 and 3). Every write is audited.</summary>
public sealed class QuestionCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> AddAsync(Guid quizId, QuestionCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.Quizzes.AnyAsync(q => q.Id == quizId, cancellationToken))
        {
            return Result.NotFound;
        }
        var (checkedQuestion, invalid) = QuestionRules.Check(command);
        if (invalid is not null)
        {
            return invalid;
        }
        var count = await db.QuizQuestions.CountAsync(q => q.QuizId == quizId, cancellationToken);
        if (count >= Quiz.MaximumQuestions)
        {
            return CurriculumRules.Invalid("text", "A quiz holds up to 50 questions.");
        }
        var q = checkedQuestion!;
        var question = new QuizQuestion(Guid.NewGuid(), tenant.OrganizationId, quizId, count + 1, q.Text, q.Type, q.Options, q.Correct, q.Answers);
        db.QuizQuestions.Add(question);
        audit.Record(new AuditEvent(AuditAction.Created, "QuizQuestion", question.Id, q.Text, After: q));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(question.Id);
    }

    public async Task<Result> UpdateAsync(Guid id, QuestionCommand command, CancellationToken cancellationToken = default)
    {
        var question = await db.QuizQuestions.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (question is null)
        {
            return Result.NotFound;
        }
        var (checkedQuestion, invalid) = QuestionRules.Check(command);
        if (invalid is not null)
        {
            return invalid;
        }
        var q = checkedQuestion!;
        var before = new CheckedQuestion(question.Text, question.Type, question.Options, question.Correct, question.Answers);
        question.Update(q.Text, q.Type, q.Options, q.Correct, q.Answers);
        audit.Record(new AuditEvent(AuditAction.Updated, "QuizQuestion", id, q.Text, before, q));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var question = await db.QuizQuestions.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (question is null)
        {
            return Result.NotFound;
        }
        db.QuizQuestions.Remove(question);
        var later = await db.QuizQuestions.Where(q => q.QuizId == question.QuizId && q.Position > question.Position).ToListAsync(cancellationToken);
        foreach (var q in later)
        {
            q.MoveTo(q.Position - 1);
        }
        audit.Record(new AuditEvent(AuditAction.Deleted, "QuizQuestion", id, question.Text, new { question.Text, Type = question.Type.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
