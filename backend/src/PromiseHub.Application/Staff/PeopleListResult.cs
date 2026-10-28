namespace PromiseHub.Application.Staff;

/// <summary>The directory page, or the filters it refused with one message per field.</summary>
public sealed record PeopleListResult(PeoplePageDto? Page, IReadOnlyDictionary<string, string>? Errors);
