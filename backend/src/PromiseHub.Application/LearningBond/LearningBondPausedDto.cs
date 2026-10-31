namespace PromiseHub.Application.LearningBond;

/// <summary>
/// learning-bond-paused (L2-151): why the claim waits, the government page that helps, the step it resumes at, and the reminder: null until
/// the guardian answers, then whether texts are coming and their dates. Status is NotCompleted once it closed.
/// </summary>
public sealed record LearningBondPausedDto(string Language, string Organization, string Explanation, Guid ChildId, string FirstName, string Status, string? Reason,
    string? HelpLink, string ResumeStep, bool? Reminder, IReadOnlyList<DateOnly> ReminderDates);
