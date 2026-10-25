namespace PromiseHub.Application.Guardian;

/// <summary>A typed name and the answers to the slip's questions.</summary>
public sealed record SignSlipRequest(string? Name, bool? Photos, string? Lunch, string? Swimming);
