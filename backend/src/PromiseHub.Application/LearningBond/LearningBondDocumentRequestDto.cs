namespace PromiseHub.Application.LearningBond;

/// <summary>A document the provider asked for (L2-150 criterion 6): its name, the file chosen if any, and whether it was sent.</summary>
public sealed record LearningBondDocumentRequestDto(Guid Id, string Name, string? FileName, DateTimeOffset? SentAt);
