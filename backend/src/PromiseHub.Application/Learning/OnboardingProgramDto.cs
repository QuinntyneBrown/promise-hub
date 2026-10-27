namespace PromiseHub.Application.Learning;

/// <summary>The program a youth is placed in, as the setup's program step shows it (read only).</summary>
public sealed record OnboardingProgramDto(string Name, string? Schedule, DateOnly StartsOn, DateOnly EndsOn);
