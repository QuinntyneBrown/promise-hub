namespace PromiseHub.Domain.Curriculum;

/// <summary>The learning event an automatic badge watches (L2-085, ADR 0058); its target is a lesson, module, quiz or assignment.</summary>
public enum BadgeRule
{
    LessonCompleted,
    ModuleCompleted,
    QuizPassed,
    AssignmentAccepted,
}
