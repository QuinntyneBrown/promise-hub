namespace PromiseHub.Application.LearningBond;

/// <summary>
/// learning-bond-total (L2-158): unlocked so far (Learning Bond deposits and each started benefit's first year), applied for (estimates of
/// what was sent and not yet confirmed), the lines by child and stream, and whether nothing is confirmed yet.
/// </summary>
public sealed record LearningBondTotalDto(string Language, string Organization, int Confirmed, int Estimated, bool NothingConfirmed, IReadOnlyList<LearningBondTotalLineDto> Lines);
