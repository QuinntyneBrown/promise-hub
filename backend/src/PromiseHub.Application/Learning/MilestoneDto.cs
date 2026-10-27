namespace PromiseHub.Application.Learning;

/// <summary>One step of the youth's milestones (L2-087 criterion 5): <see cref="Kind"/> is joined, badge or next; next has no time.</summary>
public sealed record MilestoneDto(string Kind, string Title, string Text, DateTimeOffset? At);
