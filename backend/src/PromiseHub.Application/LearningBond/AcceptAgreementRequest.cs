namespace PromiseHub.Application.LearningBond;

/// <summary>Accept the current agreement version: the authority box must be ticked (L2-136 criterion 3).</summary>
public sealed record AcceptAgreementRequest(bool Authority);
