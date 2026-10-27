using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Creates assignments and saves them with their whole rubric and its total (L2-074 criteria 1 to 4). Every write is audited.</summary>
public sealed class AssignmentCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    private static readonly Dictionary<string, SubmissionTypes> Types = new()
    {
        ["Text"] = SubmissionTypes.Text,
        ["Photo"] = SubmissionTypes.Photo,
        ["Link"] = SubmissionTypes.Link,
        ["File"] = SubmissionTypes.File,
    };

    public async Task<Result> CreateAsync(CreateAssignmentCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.CurriculumModules.AnyAsync(m => m.Id == command.ModuleId, cancellationToken))
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        if ((AssessmentRules.CheckTitle(title, "assignment") ?? await AssessmentRules.CheckLessonAsync(db, command.ModuleId, command.LessonId, cancellationToken)) is { } invalid)
        {
            return invalid;
        }
        var assignment = new Assignment(Guid.NewGuid(), tenant.OrganizationId, command.ModuleId, command.LessonId, title!);
        db.Assignments.Add(assignment);
        audit.Record(new AuditEvent(AuditAction.Created, "Assignment", assignment.Id, title!, After: new { title, command.LessonId }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(assignment.Id);
    }

    public async Task<Result> UpdateAsync(Guid id, SaveAssignmentCommand command, CancellationToken cancellationToken = default)
    {
        var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (assignment is null)
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        var brief = CurriculumRules.Clean(command.Brief);
        var errors = new Dictionary<string, string>();
        if (AssessmentRules.CheckTitle(title, "assignment") is { Errors: { } titleErrors })
        {
            errors["title"] = titleErrors["title"];
        }
        if (brief is null)
        {
            errors["brief"] = "Describe the task.";
        }
        else if (brief.Length > Assignment.MaximumBrief)
        {
            errors["brief"] = "Keep the task under 5,000 characters.";
        }
        var sent = command.SubmissionTypes ?? [];
        if (sent.Count == 0 || !sent.All(Types.ContainsKey))
        {
            errors["submissionTypes"] = "Choose at least one way to submit.";
        }
        var rubric = (command.Rubric ?? []).Select(c => (Description: CurriculumRules.Clean(c.Description), c.Points)).ToList();
        if (rubric.Count > Assignment.MaximumCriteria)
        {
            errors["rubric"] = "Keep the rubric to 10 criteria.";
        }
        else if (rubric.Any(c => c.Description is null or { Length: > RubricCriterion.MaximumDescription } || c.Points is < 1 or > RubricCriterion.MaximumPoints))
        {
            errors["rubric"] = "Give each criterion a description and 1 to 100 points.";
        }
        if (command.GraceDays is < 0 or > Assignment.MaximumGraceDays)
        {
            errors["graceDays"] = "Choose a grace period of up to 14 days.";
        }
        if (await AssessmentRules.CheckLessonAsync(db, assignment.ModuleId, command.LessonId, cancellationToken) is { Errors: { } lessonErrors })
        {
            errors["lessonId"] = lessonErrors["lessonId"];
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var types = sent.Aggregate(SubmissionTypes.None, (all, t) => all | Types[t]);
        var total = rubric.Sum(c => c.Points);
        var old = await db.RubricCriteria.Where(c => c.AssignmentId == id).OrderBy(c => c.Position).ToListAsync(cancellationToken);
        var before = new
        {
            assignment.Title,
            assignment.LessonId,
            assignment.Brief,
            SubmissionTypes = AssignmentHandler.Names(assignment.SubmissionTypes),
            Rubric = old.Select(c => new { c.Description, c.Points }),
            assignment.TotalPoints,
            assignment.DueDate,
            assignment.GraceDays,
            assignment.AllowLate,
            assignment.RequireApproval,
        };
        db.RubricCriteria.RemoveRange(old);
        for (var i = 0; i < rubric.Count; i++)
        {
            db.RubricCriteria.Add(new RubricCriterion(Guid.NewGuid(), tenant.OrganizationId, id, i + 1, rubric[i].Description!, rubric[i].Points));
        }
        assignment.Update(title!, command.LessonId, brief!, types, total, command.DueDate, command.GraceDays, command.AllowLate, command.RequireApproval);
        var after = new
        {
            Title = title,
            command.LessonId,
            Brief = brief,
            SubmissionTypes = AssignmentHandler.Names(types),
            Rubric = rubric.Select(c => new { c.Description, c.Points }),
            TotalPoints = total,
            command.DueDate,
            command.GraceDays,
            command.AllowLate,
            command.RequireApproval,
        };
        audit.Record(new AuditEvent(AuditAction.Updated, "Assignment", id, title!, before, after));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
