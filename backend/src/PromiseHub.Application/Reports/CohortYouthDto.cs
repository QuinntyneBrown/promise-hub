namespace PromiseHub.Application.Reports;

/// <summary>
/// One child of the cohort: learning as a whole percent (null without a youth account or while Learning is off), attendance (null while Roll Call is
/// off or nothing is marked), check-ins since the program started (null while Mentoring is off) and status: Ended, AtRisk or OnTrack.
/// </summary>
public sealed record CohortYouthDto(Guid ChildId, string Name, bool HasAccount, int? Learning, int? AttendanceRate, int? CheckIns, string Status);
