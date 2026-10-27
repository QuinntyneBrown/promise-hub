namespace PromiseHub.Application.Curriculum;

/// <summary>One badge for the builder (L2-084, L2-085 criterion 4): its fields, who holds it and who can still be awarded it.</summary>
public sealed record BadgeDetailDto(Guid Id, string Name, string Icon, string? Description, string Kind, string? Rule, Guid? TargetId, string? TargetTitle,
    Guid? CompetencyId, string? CompetencyName, IReadOnlyList<BadgeAwardDto> Awards, IReadOnlyList<BadgeYouthDto> Youth);
