namespace PromiseHub.Domain.Curriculum;

/// <summary>Where a track, module or lesson is in its lifecycle (L2-066, ADR 0050). In review applies to modules only; youth see only what is published.</summary>
public enum ContentStatus
{
    Draft,
    InReview,
    Published,
}
