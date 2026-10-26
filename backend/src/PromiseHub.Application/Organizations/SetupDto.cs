namespace PromiseHub.Application.Organizations;

/// <summary>The setup checklist (`setup`): each step, the next one to do, and whether all are done.</summary>
public sealed record SetupDto(IReadOnlyList<SetupStepDto> Steps, string? Next, bool Complete);
