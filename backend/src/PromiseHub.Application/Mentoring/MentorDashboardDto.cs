namespace PromiseHub.Application.Mentoring;

/// <summary>The mentor dashboard (L2-063): attendance figures are null while Roll Call is off.</summary>
public sealed record MentorDashboardDto(
    IReadOnlyList<MentoredYouthDto> Youth,
    IReadOnlyList<MentorCohortSummaryDto> Cohorts,
    int? CheckedInThisWeek,
    IReadOnlyList<MentorActivityDto>? RecentActivity);
