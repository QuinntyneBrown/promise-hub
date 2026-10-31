namespace PromiseHub.Domain.LearningBond;

/// <summary>Where a child's RESP and Learning Bond application is (L2-148 to L2-150).</summary>
public enum LearningBondApplicationStatus
{
    Draft,
    ReadyToSubmit,
    Submitted,
    Received,
    Deposited,
    Cancelled,
}
