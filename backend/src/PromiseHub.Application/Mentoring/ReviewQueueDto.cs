namespace PromiseHub.Application.Mentoring;

/// <summary>The mentor's review queue, oldest first (L2-080 criterion 1).</summary>
public sealed record ReviewQueueDto(IReadOnlyList<ReviewItemDto> Items);
