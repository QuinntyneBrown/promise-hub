namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The six figures for the organization or one covered program (L2-141): each count as a number, "0" or "FewerThan5", and the dollars, null
/// when the figures rest on fewer than 5 households (criterion 3).
/// </summary>
public sealed record LearningBondFiguresDto(string? Program, string Invited, string Started, string Completed, string Children, LearningBondDollarsDto? Estimated,
    LearningBondDollarsDto? Confirmed);
