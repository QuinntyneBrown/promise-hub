namespace PromiseHub.Application.Guardian;

public sealed record GuardianVerifyRequest(string Token, string? Code);
