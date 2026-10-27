namespace PromiseHub.Application.Learning;

/// <summary>The answers so far and the step to resume at.</summary>
public sealed record SaveOnboardingRequest(int Step, string? PreferredName, string? Pronouns, bool LessonReminders, bool MentorMessages, bool Announcements);
