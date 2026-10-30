namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The agent's answer (L2-160): the approved fixed line for the step, shown first; the reply that replaces it, or null; and whether the
/// page shows the model's words or the fixed ones.
/// </summary>
public sealed record LearningBondAgentReplyDto(string Step, string Fixed, string? Reply, string Source);
