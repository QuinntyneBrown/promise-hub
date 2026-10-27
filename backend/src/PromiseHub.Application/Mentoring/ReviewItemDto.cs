namespace PromiseHub.Application.Mentoring;

/// <summary>
/// One piece of work waiting for the mentor (L2-080 criterion 1): an assignment submission (<see cref="Kind"/> Assignment) or a quiz attempt
/// awaiting approval (Quiz, with its auto-score).
/// </summary>
public sealed record ReviewItemDto(Guid Id, string Kind, Guid MembershipId, string YouthName, string Title, string ModuleTitle, DateTimeOffset SubmittedAt, bool Late, string Status, int? Score);
