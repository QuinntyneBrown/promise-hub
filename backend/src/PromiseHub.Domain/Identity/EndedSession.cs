namespace PromiseHub.Domain.Identity;

/// <summary>
/// A session that was signed out (L2-048). A cookie carrying its id is refused until <see cref="ExpiresAt"/>, the latest
/// the cookie could still have lived. Not tenant-owned, like <see cref="StaffUser"/>.
/// </summary>
public sealed class EndedSession
{
    public EndedSession(Guid id, Guid userId, DateTimeOffset endedAt, DateTimeOffset expiresAt)
    {
        Id = id;
        UserId = userId;
        EndedAt = endedAt;
        ExpiresAt = expiresAt;
    }

    /// <summary>The session id the cookie carries.</summary>
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTimeOffset EndedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
}
