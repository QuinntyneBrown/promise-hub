using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>One quiz of the caller's organization for the quiz builder, or null (L2-073 criteria 1 to 5, 8).</summary>
public sealed class QuizHandler(IPromiseHubDb db, CurriculumPrograms programs)
{
    public async Task<QuizDetailDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var quiz = await db.Quizzes.AsNoTracking().FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null)
        {
            return null;
        }
        var module = await db.CurriculumModules.AsNoTracking().SingleAsync(m => m.Id == quiz.ModuleId, cancellationToken);
        var track = await db.Tracks.AsNoTracking().SingleAsync(t => t.Id == module.TrackId, cancellationToken);
        var questions = (await db.QuizQuestions.AsNoTracking().Where(q => q.QuizId == id).OrderBy(q => q.Position).ToListAsync(cancellationToken))
            .Select(q => new QuizQuestionDto(q.Id, q.Position, q.Text, q.Type.ToString(), CurriculumRules.SplitLines(q.Options),
                QuestionRules.SplitIndexes(q.Correct), CurriculumRules.SplitLines(q.Answers)))
            .ToList();
        return new QuizDetailDto(quiz.Id, module.Id, module.Title, track.Id, track.Name, quiz.Title, quiz.LessonId, quiz.Status.ToString(),
            quiz.PassMark, quiz.AttemptsAllowed, quiz.Feedback.ToString(), quiz.Shuffle, quiz.RequiredToComplete, questions,
            await LessonsAsync(db, module.Id, cancellationToken), await programs.FollowingAsync(track.Id, cancellationToken));
    }

    /// <summary>The module's live lessons in order, for the Attached to choice.</summary>
    public static Task<List<LessonOptionDto>> LessonsAsync(IPromiseHubDb db, Guid moduleId, CancellationToken cancellationToken) =>
        db.Lessons.AsNoTracking().Where(l => l.ModuleId == moduleId && l.DeletedAt == null).OrderBy(l => l.Position)
            .Select(l => new LessonOptionDto(l.Id, l.Position, l.Title)).ToListAsync(cancellationToken);
}
