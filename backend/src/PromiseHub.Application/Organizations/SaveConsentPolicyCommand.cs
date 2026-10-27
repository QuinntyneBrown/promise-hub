namespace PromiseHub.Application.Organizations;

public sealed record SaveConsentPolicyCommand(int ConsentAge, string? Wording);
