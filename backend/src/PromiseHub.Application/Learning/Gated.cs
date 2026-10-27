namespace PromiseHub.Application.Learning;

/// <summary>A youth read: found with a value, not found (not visible), or locked with what to finish first (ADR 0051).</summary>
public sealed record Gated<T>(ResultStatus Status, T? Value = default, string? UnlockAfter = null)
{
    public static Gated<T> Found(T value) => new(ResultStatus.Done, value);

    public static Gated<T> NotFound() => new(ResultStatus.NotFound);

    public static Gated<T> Locked(string? unlockAfter) => new(ResultStatus.Forbidden, UnlockAfter: unlockAfter);
}
