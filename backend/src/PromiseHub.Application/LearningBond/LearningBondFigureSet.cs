namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The raw figures for a set of covered households over a period (L2-141 criterion 2): counts of households and children, and dollars
/// estimated and confirmed, each split into Learning Bond and benefits. Never shown before suppression.
/// </summary>
public sealed record LearningBondFigureSet(int Invited, int Started, int Completed, int Children, int EstimatedLearningBond, int EstimatedBenefits,
    int ConfirmedLearningBond, int ConfirmedBenefits);
