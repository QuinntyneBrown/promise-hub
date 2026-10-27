using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Rules quizzes and assignments share (L2-073, L2-074): the title and the lesson they are attached to.</summary>
public static class AssessmentRules
{
    /// <summary>"Give the quiz a title." or "Give the assignment a title.", or null when the title fits.</summary>
    public static Result? CheckTitle(string? title, string what) =>
        title is null ? CurriculumRules.Invalid("title", $"Give the {what} a title.")
        : title.Length > Quiz.MaximumTitle ? CurriculumRules.Invalid("title", "Keep the title under 120 characters.")
        : null;

    /// <summary>Null for the whole module or a live lesson of the module; otherwise the refusal.</summary>
    public static async Task<Result?> CheckLessonAsync(IPromiseHubDb db, Guid moduleId, Guid? lessonId, CancellationToken cancellationToken) =>
        lessonId is { } id && !await db.Lessons.AnyAsync(l => l.Id == id && l.ModuleId == moduleId && l.DeletedAt == null, cancellationToken)
            ? CurriculumRules.Invalid("lessonId", "Choose a lesson of this module.")
            : null;
}
