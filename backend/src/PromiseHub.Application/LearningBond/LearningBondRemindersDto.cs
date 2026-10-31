namespace PromiseHub.Application.LearningBond;

/// <summary>learning-bond-reminders (L2-157 criterion 1): the reminders still ahead, each with Turn off.</summary>
public sealed record LearningBondRemindersDto(string Language, string Organization, IReadOnlyList<LearningBondDateReminderDto> Reminders);
