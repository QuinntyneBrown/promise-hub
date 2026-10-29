namespace PromiseHub.Application.Reports;

/// <summary>One mentor's cohorts, youth, check-ins and reviews in the period, and the load: Overloaded above 8 youth, Underloaded below 4, else Balanced.</summary>
public sealed record MentorActivityRowDto(Guid MembershipId, string Name, IReadOnlyList<StaffCohortDto> Cohorts, int Caseload, int CheckIns, int? Reviews, string Load);
