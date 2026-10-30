namespace PromiseHub.Domain.LearningBond;

/// <summary>Where one child's Learning Bond claim is (L2-142, L2-150): it starts with the consent and moves with the intake and the application.</summary>
public enum LearningBondClaimStatus
{
    Started,
    Paused,
    Submitted,
    Deposited,
    NotCompleted,
}
