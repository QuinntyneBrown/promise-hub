namespace PromiseHub.Application.Identity;

/// <summary>Change password while signed in (L2-118): the current password, the new one and the new one again.</summary>
public sealed record ChangePasswordRequest(string? Current, string? Password, string? Repeat);
