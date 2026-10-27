using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>One assignment of the caller's organization for the assignment builder, or null (L2-074 criteria 1, 2 and 7).</summary>
public sealed class AssignmentHandler(IPromiseHubDb db, CurriculumPrograms programs)
{
    public async Task<AssignmentDetailDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var assignment = await db.Assignments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (assignment is null)
        {
            return null;
        }
        var module = await db.CurriculumModules.AsNoTracking().SingleAsync(m => m.Id == assignment.ModuleId, cancellationToken);
        var track = await db.Tracks.AsNoTracking().SingleAsync(t => t.Id == module.TrackId, cancellationToken);
        var rubric = await db.RubricCriteria.AsNoTracking().Where(c => c.AssignmentId == id).OrderBy(c => c.Position)
            .Select(c => new RubricCriterionDto(c.Description, c.Points)).ToListAsync(cancellationToken);
        return new AssignmentDetailDto(assignment.Id, module.Id, module.Title, track.Id, track.Name, assignment.Title, assignment.LessonId,
            assignment.Status.ToString(), assignment.Brief, Names(assignment.SubmissionTypes), rubric, assignment.TotalPoints, assignment.DueDate,
            assignment.GraceDays, assignment.AllowLate, assignment.RequireApproval, await QuizHandler.LessonsAsync(db, module.Id, cancellationToken),
            await programs.FollowingAsync(track.Id, cancellationToken));
    }

    /// <summary>Text, Photo, Link and File in that order, for the ways that are on.</summary>
    public static IReadOnlyList<string> Names(SubmissionTypes types) =>
        new[] { SubmissionTypes.Text, SubmissionTypes.Photo, SubmissionTypes.Link, SubmissionTypes.File }.Where(t => types.HasFlag(t)).Select(t => t.ToString()).ToList();
}
