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
}
