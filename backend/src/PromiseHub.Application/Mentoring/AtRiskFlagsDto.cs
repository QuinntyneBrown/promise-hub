namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The flags the caller reads (L2-091 criterion 4): open or resolved, both counts, the mentor's youth to raise a flag on (empty for admins and
/// program directors) and whether the caller may raise one.
/// </summary>
public sealed record AtRiskFlagsDto(IReadOnlyList<AtRiskFlagDto> Items, int OpenCount, int ResolvedCount, IReadOnlyList<YouthOptionDto> Youth, bool CanRaise);
