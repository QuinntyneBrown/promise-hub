namespace PromiseHub.Application.Guardian;

/// <summary>How the family page reaches the primary guardian, for them to correct.</summary>
public sealed record GuardianHomeContactDto(string Name, string? Mobile, string? Email, string Language);
