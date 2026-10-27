using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Creates, saves, publishes and deletes lessons (L2-067 criteria 1, 2, 4 and 6); a deleted lesson's quizzes and assignments move to the whole module (L2-073, L2-074). Every write is audited.</summary>
public sealed class LessonCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> CreateAsync(CreateLessonCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.CurriculumModules.AnyAsync(m => m.Id == command.ModuleId, cancellationToken))
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        if (CheckTitle(title) is { } invalid)
        {
            return invalid;
        }
        var position = await db.Lessons.CountAsync(l => l.ModuleId == command.ModuleId && l.DeletedAt == null, cancellationToken) + 1;
        var lesson = new Lesson(Guid.NewGuid(), tenant.OrganizationId, command.ModuleId, title!, position);
        db.Lessons.Add(lesson);
        audit.Record(new AuditEvent(AuditAction.Created, "Lesson", lesson.Id, title!, After: new { title, position }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(lesson.Id);
    }

    public async Task<Result> UpdateAsync(Guid id, SaveLessonCommand command, CancellationToken cancellationToken = default)
    {
        var lesson = await Live(id, cancellationToken);
        if (lesson is null)
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        var reading = CurriculumRules.Clean(command.Reading);
        var body = CurriculumRules.Clean(command.Body);
        var notes = CurriculumRules.Clean(command.LeaderNotes);
        var errors = new Dictionary<string, string>();
        if (CheckTitle(title) is { Errors: { } titleErrors })
        {
            errors["title"] = titleErrors["title"];
        }
        if (reading is { Length: > Lesson.MaximumReading })
        {
            errors["reading"] = "Keep the reading under 200 characters.";
        }
        if (command.Minutes is < 1 or > 600)
        {
            errors["minutes"] = "Estimate between 1 and 600 minutes.";
        }
        if (body is { Length: > Lesson.MaximumBody })
        {
            errors["body"] = "Keep the teaching content under 20,000 characters.";
        }
        if (notes is { Length: > Lesson.MaximumNotes })
        {
            errors["leaderNotes"] = "Keep the leader guide notes under 4,000 characters.";
        }
        CheckLines("objectives", command.Objectives, errors);
        CheckLines("prompts", command.Prompts, errors);
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var before = new { lesson.Title, lesson.Reading, lesson.Minutes, lesson.Objectives, lesson.Body, lesson.Prompts, lesson.LeaderNotes };
        lesson.Update(title!, reading, command.Minutes, CurriculumRules.JoinLines(command.Objectives), body, CurriculumRules.JoinLines(command.Prompts), notes);
        audit.Record(new AuditEvent(AuditAction.Updated, "Lesson", id, title!, before,
            new { lesson.Title, lesson.Reading, lesson.Minutes, lesson.Objectives, lesson.Body, lesson.Prompts, lesson.LeaderNotes }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> SetStatusAsync(Guid id, string? status, CancellationToken cancellationToken = default)
    {
        var lesson = await Live(id, cancellationToken);
        if (lesson is null)
        {
            return Result.NotFound;
        }
        if (CurriculumRules.ParseStatus(status, allowReview: false) is not { } next)
        {
            return CurriculumRules.Invalid("status", "Choose Draft or Published.");
        }
        if (next == ContentStatus.Published && lesson.Body is null)
        {
            return CurriculumRules.Invalid("status", "Add teaching content before publishing.");
        }
        var before = lesson.Status.ToString();
        lesson.SetStatus(next);
        audit.Record(new AuditEvent(AuditAction.Updated, "Lesson", id, $"{lesson.Title} · {next}", new { Status = before }, new { Status = next.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lesson = await Live(id, cancellationToken);
        if (lesson is null)
        {
            return Result.NotFound;
        }
        lesson.Delete(clock.GetUtcNow());
        var rest = await db.Lessons.Where(l => l.ModuleId == lesson.ModuleId && l.DeletedAt == null && l.Id != id).OrderBy(l => l.Position).ToListAsync(cancellationToken);
        for (var i = 0; i < rest.Count; i++)
        {
            rest[i].MoveTo(i + 1);
        }
        // Its quizzes and assignments now belong to the whole module (ADR 0054).
        foreach (var quiz in await db.Quizzes.Where(q => q.LessonId == id).ToListAsync(cancellationToken))
        {
            quiz.Detach();
        }
        foreach (var assignment in await db.Assignments.Where(a => a.LessonId == id).ToListAsync(cancellationToken))
        {
            assignment.Detach();
        }
        audit.Record(new AuditEvent(AuditAction.Deleted, "Lesson", id, lesson.Title, new { lesson.Title, Status = lesson.Status.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private Task<Lesson?> Live(Guid id, CancellationToken cancellationToken) =>
        db.Lessons.FirstOrDefaultAsync(l => l.Id == id && l.DeletedAt == null, cancellationToken);

    private static Result? CheckTitle(string? title) => title switch
    {
        null => CurriculumRules.Invalid("title", "Give the lesson a title."),
        { Length: > Lesson.MaximumTitle } => CurriculumRules.Invalid("title", "Keep the title under 120 characters."),
        _ => null,
    };

    private static void CheckLines(string field, IReadOnlyList<string>? lines, Dictionary<string, string> errors)
    {
        var kept = (lines ?? []).Where(l => !string.IsNullOrWhiteSpace(l)).ToList();
        if (kept.Count > Lesson.MaximumLines)
        {
            errors[field] = "Keep it to 10 lines.";
        }
        else if (kept.Any(l => l.Trim().Length > Lesson.MaximumLine))
        {
            errors[field] = "Keep each line under 300 characters.";
        }
    }
}
