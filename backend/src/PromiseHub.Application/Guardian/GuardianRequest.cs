namespace PromiseHub.Application.Guardian;

/// <summary>What a guardian request carries besides its body: the link token, the device cookie and the browser.</summary>
public sealed record GuardianRequest(string Token, string? DeviceToken, string? UserAgent);
