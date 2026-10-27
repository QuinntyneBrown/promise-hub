namespace PromiseHub.Application.Learning;

/// <summary>A youth read or write: found with a value, not found (not visible), locked with what to finish first, invalid or a conflict with its code (ADR 0051).</summary>
public sealed record Gated<T>(ResultStatus Status, T? Value = default, string? UnlockAfter = null, IReadOnlyDictionary<string, string>? Errors = null, string? Code = null)
{
    public static Gated<T> Found(T value) => new(ResultStatus.Done, value);

    public static Gated<T> NotFound() => new(ResultStatus.NotFound);

    public static Gated<T> Locked(string? unlockAfter) => new(ResultStatus.Forbidden, UnlockAfter: unlockAfter);

    public static Gated<T> Conflict(string code) => new(ResultStatus.Conflict, Code: code);

    public static Gated<T> Invalid(IReadOnlyDictionary<string, string> errors) => new(ResultStatus.Invalid, Errors: errors);
}
