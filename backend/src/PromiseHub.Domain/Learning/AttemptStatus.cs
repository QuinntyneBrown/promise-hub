namespace PromiseHub.Domain.Learning;

/// <summary>Where a quiz attempt stands (L2-075, L2-076, ADR 0055).</summary>
public enum AttemptStatus
{
    /// <summary>Being answered; answers still change.</summary>
    InProgress,

    /// <summary>Submitted and scored; it counts.</summary>
    Scored,

    /// <summary>Submitted and scored for a quiz whose scores a mentor approves; it counts only once approved (prompt 63).</summary>
    AwaitingApproval,
}
