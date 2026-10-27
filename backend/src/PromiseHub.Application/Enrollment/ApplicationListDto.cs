namespace PromiseHub.Application.Enrollment;

/// <summary>The pipeline for one status, with the count of every status.</summary>
public sealed record ApplicationListDto(ApplicationCountsDto Counts, IReadOnlyList<ApplicationSummaryDto> Applications);
