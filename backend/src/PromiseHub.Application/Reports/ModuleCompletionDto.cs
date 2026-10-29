namespace PromiseHub.Application.Reports;

/// <summary>A published module of the track and the average share of its lessons the cohort's youth have done, a whole percent.</summary>
public sealed record ModuleCompletionDto(Guid ModuleId, string Title, int Completion);
