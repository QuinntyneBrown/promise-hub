namespace PromiseHub.Application.Learning;

/// <summary>One of the youth's tracks on the Learning home, with the program that follows it.</summary>
public sealed record TrackSummaryDto(Guid Id, string Name, string? Description, string Program, int CompletedLessons, int TotalLessons);
