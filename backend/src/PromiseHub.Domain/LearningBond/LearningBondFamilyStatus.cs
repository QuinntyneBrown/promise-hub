namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// Where a covered household is in Learning Bond, as staff see it (L2-142 criterion 1): computed from its records, never stored, and never
/// more than the step it has reached.
/// </summary>
public enum LearningBondFamilyStatus
{
    NotInvited,
    Invited,
    Started,
    PausedNeedsSin,
    PausedNeedsTaxReturn,
    PausedNeedsDocument,
    Submitted,
    Deposited,
    CallRequested,
    NotCompleted,
    NotInterested,
}
