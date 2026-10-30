namespace PromiseHub.Application.LearningBond;

/// <summary>The agent's context and every amount it may state, all produced by the rules (L2-160 criterion 3).</summary>
public sealed record AgentFacts(AgentContext Context, IReadOnlySet<int> Amounts);
