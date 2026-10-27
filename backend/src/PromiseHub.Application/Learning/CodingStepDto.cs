namespace PromiseHub.Application.Learning;

public sealed record CodingStepDto(Guid Id, string Title, string Instructions, string? Sample, string CheckLabel);
