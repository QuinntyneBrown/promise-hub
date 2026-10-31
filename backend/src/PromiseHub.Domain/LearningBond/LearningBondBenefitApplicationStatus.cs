namespace PromiseHub.Domain.LearningBond;

/// <summary>Where one benefit's application is (L2-156): prepared, complete, sent through the program's channel, or sent by the guardian.</summary>
public enum LearningBondBenefitApplicationStatus
{
    Draft,
    ReadyToSubmit,
    Submitted,
    MarkedSent,
}
