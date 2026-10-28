namespace PromiseHub.Application.Mentoring;

/// <summary>The mentor dashboard (L2-063): attendance figures are null while Roll Call is off; follow-ups come from his mentor check-ins (L2-090).</summary>
public sealed record MentorDashboardDto(
    IReadOnlyList<MentoredYouthDto> Youth,
    IReadOnlyList<MentorCohortSummaryDto> Cohorts,
    int? CheckedInThisWeek,
    IReadOnlyList<MentorActivityDto>? RecentActivity,
    IReadOnlyList<MentorFollowUpDto> FollowUps);
