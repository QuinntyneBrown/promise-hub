namespace PromiseHub.Application.Mentoring;

/// <summary>The caller's mentor check-ins, newest first, and his youth to filter by (L2-090 criterion 4).</summary>
public sealed record MentorCheckInHistoryDto(IReadOnlyList<MentorCheckInDto> Items, IReadOnlyList<YouthOptionDto> Youth);
