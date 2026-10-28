namespace PromiseHub.Application.Mentoring;

/// <summary>When the mentor plans to talk with one of his youth again, from his latest mentor check-in (L2-090 criterion 6).</summary>
public sealed record MentorFollowUpDto(Guid ChildId, string YouthName, string FollowUpOn, bool Overdue);
