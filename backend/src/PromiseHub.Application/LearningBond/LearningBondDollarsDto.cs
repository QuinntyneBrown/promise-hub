namespace PromiseHub.Application.LearningBond;

/// <summary>Dollars split into Learning Bond and benefits (L2-141 criterion 2).</summary>
public sealed record LearningBondDollarsDto(int Total, int LearningBond, int Benefits);
