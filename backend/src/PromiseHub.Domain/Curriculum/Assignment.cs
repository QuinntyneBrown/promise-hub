using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>
/// An assignment of a curriculum module (L2-074, ADR 0054), attached to the whole module (LessonId null) or one of its lessons: the task,
/// the ways to submit, the rubric's total and the due rules. New assignments are drafts accepting a text reflection.
/// </summary>
public sealed class Assignment : ITenantOwned
{
    public const int MaximumBrief = 5000;
    public const int MaximumGraceDays = 14;
    public const int MaximumCriteria = 10;

    public Assignment(Guid id, Guid organizationId, Guid moduleId, Guid? lessonId, string title)
    {
        Id = id;
        OrganizationId = organizationId;
        ModuleId = moduleId;
        LessonId = lessonId;
        Title = title;
        SubmissionTypes = SubmissionTypes.Text;
        Status = ContentStatus.Draft;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ModuleId { get; private set; }

    /// <summary>The lesson youth meet it after; null for the whole module.</summary>
    public Guid? LessonId { get; private set; }
    public string Title { get; private set; }

    /// <summary>The task youth read; required before publishing.</summary>
    public string? Brief { get; private set; }
    public SubmissionTypes SubmissionTypes { get; private set; }

    /// <summary>The sum of the rubric's points, stored when the rubric is saved.</summary>
    public int TotalPoints { get; private set; }
    public DateOnly? DueDate { get; private set; }

    /// <summary>Days after the due date that work is still on time, 0 to 14.</summary>
    public int GraceDays { get; private set; }

    /// <summary>Late work is accepted and flagged for the mentor.</summary>
    public bool AllowLate { get; private set; }

    /// <summary>A mentor approves before it counts as complete.</summary>
    public bool RequireApproval { get; private set; }
    public ContentStatus Status { get; private set; }

    public void Update(string title, Guid? lessonId, string brief, SubmissionTypes types, int totalPoints, DateOnly? dueDate, int graceDays, bool allowLate, bool requireApproval)
    {
        Title = title;
        LessonId = lessonId;
        Brief = brief;
        SubmissionTypes = types;
        TotalPoints = totalPoints;
        DueDate = dueDate;
        GraceDays = graceDays;
        AllowLate = allowLate;
        RequireApproval = requireApproval;
    }

    /// <summary>Its lesson was deleted: it now belongs to the whole module.</summary>
    public void Detach() => LessonId = null;

    public void SetStatus(ContentStatus status) => Status = status;
}
