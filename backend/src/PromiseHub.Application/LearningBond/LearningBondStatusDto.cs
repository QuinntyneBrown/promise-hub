namespace PromiseHub.Application.LearningBond;

/// <summary>The staff module check: answered only while Learning Bond is on for the caller's organization (L2-162 criterion 7).</summary>
public sealed record LearningBondStatusDto(bool On);
