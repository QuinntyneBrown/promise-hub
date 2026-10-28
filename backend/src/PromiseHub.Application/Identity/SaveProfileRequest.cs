namespace PromiseHub.Application.Identity;

/// <summary>The profile of the active membership (L2-117): the name and an optional mobile; empty clears the mobile.</summary>
public sealed record SaveProfileRequest(string? Name, string? Mobile);
