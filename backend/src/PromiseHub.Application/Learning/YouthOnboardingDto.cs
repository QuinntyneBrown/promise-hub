namespace PromiseHub.Application.Learning;

/// <summary>A youth's setup: <see cref="Status"/> is "not-started", "in-progress" or "completed"; <see cref="Program"/> is null until placed.</summary>
public sealed record YouthOnboardingDto(
    string Status,
    int Step,
    string PreferredName,
    string? Pronouns,
    bool LessonReminders,
    bool MentorMessages,
    bool Announcements,
    OnboardingProgramDto? Program);
