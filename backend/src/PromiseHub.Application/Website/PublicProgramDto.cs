namespace PromiseHub.Application.Website;

/// <summary>
/// A current program as a visitor sees it (L2-133): when, who, the dates, Running or Upcoming, the enrollment link's path while open, the
/// published track while Learning is on and the lead mentor's first name while Mentoring is on. No capacity, counts or children.
/// </summary>
public sealed record PublicProgramDto(string Name, string? Schedule, string? Ages, DateOnly StartsOn, DateOnly EndsOn, string Status, string? ApplyPath, string? Track, string? LeadMentor);
