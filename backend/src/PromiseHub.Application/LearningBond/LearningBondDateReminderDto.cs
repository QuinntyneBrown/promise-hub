namespace PromiseHub.Application.LearningBond;

/// <summary>One reminder on learning-bond-reminders (L2-157): its kind, what it is about (the tax year, a first name or a benefit), when.</summary>
public sealed record LearningBondDateReminderDto(Guid Id, string Kind, string Subject, DateOnly DueOn, DateOnly EventOn, bool TurnedOff);
