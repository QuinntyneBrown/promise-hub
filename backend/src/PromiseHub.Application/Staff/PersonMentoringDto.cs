namespace PromiseHub.Application.Staff;

/// <summary>A person's mentoring while Mentoring is on: a youth's mentor (or null) and a mentor's youth.</summary>
public sealed record PersonMentoringDto(string? Mentor, IReadOnlyList<string> Youth);
