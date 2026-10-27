namespace PromiseHub.Application.Staff;

/// <summary>The Youth account card on a child record (L2-051): None, Invited (email and expiry) or Active (name and email).</summary>
public sealed record YouthAccountDto(string Status, string? Name, string? Email, DateTimeOffset? ExpiresAt);
