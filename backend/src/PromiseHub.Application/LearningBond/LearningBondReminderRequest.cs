namespace PromiseHub.Application.LearningBond;

/// <summary>Remind me in 14 days? Yes or no (L2-151 criterion 3).</summary>
public sealed record LearningBondReminderRequest(bool? Remind);
