namespace PromiseHub.Application.Guardian;

/// <summary>
/// A youth's Learning progress as her guardian reads it (L2-102 criterion 4): the same numbers the youth sees, and no lesson content, quiz
/// questions or answers, reflections, mentor notes or check-ins.
/// </summary>
public sealed record GuardianLearningDto(int CompletedLessons, int TotalLessons, IReadOnlyList<GuardianModuleDto> Modules, IReadOnlyList<GuardianBadgeDto> Badges, int BadgeCount);
