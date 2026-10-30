namespace PromiseHub.Domain.LearningBond;

/// <summary>Why a child's claim waits (L2-146, L2-151): the record needs fixing, a SIN is missing, or a tax return is needed.</summary>
public enum LearningBondPausedReason
{
    AwaitingRecordFix,
    NeedsSin,
    NeedsTaxReturn,
}
