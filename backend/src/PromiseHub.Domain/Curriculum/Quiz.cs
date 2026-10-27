using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>
/// A quiz of a curriculum module (L2-073, ADR 0054), attached to the whole module (LessonId null) or one of its lessons, with the rules
/// youth take it under. New quizzes are drafts with a 70% pass mark, 2 attempts and the answers shown after each attempt.
/// </summary>
public sealed class Quiz : ITenantOwned
{
    public const int MaximumTitle = 120;
    public const int MaximumQuestions = 50;

    public Quiz(Guid id, Guid organizationId, Guid moduleId, Guid? lessonId, string title)
    {
        Id = id;
        OrganizationId = organizationId;
        ModuleId = moduleId;
        LessonId = lessonId;
        Title = title;
        PassMark = 70;
        AttemptsAllowed = 2;
        Feedback = FeedbackMode.ShowAnswers;
        Status = ContentStatus.Draft;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ModuleId { get; private set; }

    /// <summary>The lesson youth meet it after; null for the whole module.</summary>
    public Guid? LessonId { get; private set; }
    public string Title { get; private set; }

    /// <summary>The percentage of questions answered correctly to pass, 1 to 100.</summary>
    public int PassMark { get; private set; }

    /// <summary>1 to 10, or null for unlimited; the best attempt counts.</summary>
    public int? AttemptsAllowed { get; private set; }
    public FeedbackMode Feedback { get; private set; }
    public bool Shuffle { get; private set; }

    /// <summary>Youth pass it before the module counts as done.</summary>
    public bool RequiredToComplete { get; private set; }
    public ContentStatus Status { get; private set; }

    public void Update(string title, Guid? lessonId, int passMark, int? attemptsAllowed, FeedbackMode feedback, bool shuffle, bool requiredToComplete)
    {
        Title = title;
        LessonId = lessonId;
        PassMark = passMark;
        AttemptsAllowed = attemptsAllowed;
        Feedback = feedback;
        Shuffle = shuffle;
        RequiredToComplete = requiredToComplete;
    }

    /// <summary>Its lesson was deleted: it now belongs to the whole module.</summary>
    public void Detach() => LessonId = null;

    public void SetStatus(ContentStatus status) => Status = status;
}
