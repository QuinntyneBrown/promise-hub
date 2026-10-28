namespace PromiseHub.Application.Staff;

/// <summary>The directory's filters (page: people): free text on name or email, a role, a status, a program and a page of 25.</summary>
public sealed record PeopleQuery(string? Q, string? Role, string? Status, Guid? ProgramId, int Page = 1);
