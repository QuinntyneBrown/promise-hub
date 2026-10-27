namespace PromiseHub.Application.Guardian;

/// <summary>A typed signature: the guardian's name, how they are related, and the ticked consent box.</summary>
public sealed record GiveConsentRequest(string? Name, string? Relationship, bool Agree);
