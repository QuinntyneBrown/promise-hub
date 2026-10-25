namespace PromiseHub.Application;

/// <summary>The outcome of a command: done, created with an id, not found, or invalid with one message per field.</summary>
public sealed record Result(ResultStatus Status, Guid? Id = null, IReadOnlyDictionary<string, string>? Errors = null)
{
    public static readonly Result Done = new(ResultStatus.Done);
    public static readonly Result NotFound = new(ResultStatus.NotFound);

    public static Result Created(Guid id) => new(ResultStatus.Created, id);

    public static Result Invalid(IReadOnlyDictionary<string, string> errors) => new(ResultStatus.Invalid, Errors: errors);
}
