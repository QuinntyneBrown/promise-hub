namespace PromiseHub.Application.Reports;

/// <summary>A child's mentoring without what was said (ADR 0061): the mentor, how many check-ins, the latest date and engagement, whether a flag is open.</summary>
public sealed record YouthMentoringDto(string? MentorName, int CheckIns, DateOnly? LatestOn, string? LatestEngagement, bool OpenFlag);
