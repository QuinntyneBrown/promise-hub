namespace PromiseHub.Application.Curriculum;

/// <summary>What the badge builder offers (L2-084 criterion 2): the organization's lessons, modules, quizzes, assignments and competencies.</summary>
public sealed record BadgeOptionsDto(IReadOnlyList<BadgeTargetDto> Lessons, IReadOnlyList<BadgeTargetDto> Modules, IReadOnlyList<BadgeTargetDto> Quizzes,
    IReadOnlyList<BadgeTargetDto> Assignments, IReadOnlyList<BadgeCompetencyDto> Competencies);
