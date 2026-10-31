namespace PromiseHub.Application.LearningBond;

/// <summary>The only facts the model is given (L2-160 criterion 1): the organization, the children, whether benefits were checked, and the totals.</summary>
public sealed record AgentContext(string Organization, IReadOnlyList<AgentChild> Children, bool BenefitsChecked, int Unlocked, int AppliedFor);
