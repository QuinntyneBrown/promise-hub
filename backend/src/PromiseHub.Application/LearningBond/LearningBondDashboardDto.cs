namespace PromiseHub.Application.LearningBond;

/// <summary>learning-bond-dashboard (L2-141): the covered programs to filter by, the period, the organization's figures and a row per program.</summary>
public sealed record LearningBondDashboardDto(IReadOnlyList<LearningBondProgramDto> Programs, string Period, Guid? Program, LearningBondFiguresDto All,
    IReadOnlyList<LearningBondFiguresDto> Rows, bool Empty);
