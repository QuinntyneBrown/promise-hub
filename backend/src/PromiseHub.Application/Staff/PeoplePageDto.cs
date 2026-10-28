namespace PromiseHub.Application.Staff;

/// <summary>One page of the people directory, with the roles a filter may name and the programs to filter by (L2-112).</summary>
public sealed record PeoplePageDto(IReadOnlyList<PersonRowDto> Items, int Total, int Page, int PageSize, IReadOnlyList<string> Roles, IReadOnlyList<ProgramOptionDto> Programs);
