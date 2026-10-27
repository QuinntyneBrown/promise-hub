namespace PromiseHub.Application.Mentoring;

/// <summary>A youth's competencies (L2-082 criterion 1): every competency of the organization in order and how many are Proficient or Mastered.</summary>
public sealed record CompetencySheetDto(Guid ChildId, string Name, IReadOnlyList<CompetencyItemDto> Items, int ProficientOrMastered, int Total);
