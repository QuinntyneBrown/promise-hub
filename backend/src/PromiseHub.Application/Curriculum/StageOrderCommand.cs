namespace PromiseHub.Application.Curriculum;

/// <summary>Every stage of the organization, in its new order (L2-086 criterion 3).</summary>
public sealed record StageOrderCommand(IReadOnlyList<Guid>? StageIds);
