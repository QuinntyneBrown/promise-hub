namespace PromiseHub.Application.Guardian;

/// <summary>A child's attendance while Roll Call is on: how many sessions present, late, excused and absent, and the five most recent (L2-102 criterion 3).</summary>
public sealed record GuardianAttendanceDto(int Present, int Late, int Excused, int Absent, IReadOnlyList<GuardianAttendanceRowDto> Recent);
