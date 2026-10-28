namespace PromiseHub.Domain.Identity;

/// <summary>
/// An emailed link to choose a new password (L2-044, L2-115). Only the token's hash is kept; it works once, for one hour, and only
/// while it is the account's newest link. At most <see cref="PerHour"/> links are sent to an account in any hour (ADR 0071).
/// </summary>
public sealed class PasswordReset
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

    public const int PerHour = 3;

    public PasswordReset(Guid id, Guid userId, string tokenHash, DateTimeOffset createdAt)
    {
        Id = id;
        UserId = userId;
        TokenHash = tokenHash;
        CreatedAt = createdAt;
        ExpiresAt = createdAt + Lifetime;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? UsedAt { get; private set; }

    public bool Usable(DateTimeOffset now) => UsedAt is null && now < ExpiresAt;

    public void Use(DateTimeOffset now) => UsedAt = now;

    /// <summary>A newer link was sent: this one can no longer be used.</summary>
    public void Replace(DateTimeOffset now) => UsedAt ??= now;
}
