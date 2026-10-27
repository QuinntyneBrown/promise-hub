namespace PromiseHub.Application.Guardian;

/// <summary>A consent request: sent to the masked contacts, not needed (the child needs no consent), or no guardian who may sign can be reached.</summary>
public sealed record ConsentRequestResult(ConsentRequestOutcome Outcome, IReadOnlyList<string> SentTo);
