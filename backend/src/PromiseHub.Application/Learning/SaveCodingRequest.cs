namespace PromiseHub.Application.Learning;

/// <summary>The youth's code and the steps they ticked.</summary>
public sealed record SaveCodingRequest(string? Code, IReadOnlyList<Guid>? CheckedStepIds);
