using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>
/// A youth's first-run setup (L2-059, ADR 0047): the step to resume at and the answers saved so far, one row per youth membership.
/// The child record keeps the legal name; <see cref="PreferredName"/> is the name the youth goes by in Learning.
/// </summary>
public sealed class YouthOnboarding : ITenantOwned
{
    public const int Steps = 3;
    public const int MaximumPreferredName = 60;

    /// <summary>The pronouns a youth can choose; none is also allowed.</summary>
    public static readonly IReadOnlyList<string> PronounChoices = ["she/her", "he/him", "they/them"];

    public YouthOnboarding(Guid id, Guid organizationId, Guid membershipId, DateTimeOffset startedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        StartedAt = startedAt;
        PreferredName = string.Empty;
        Step = 1;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public int Step { get; private set; }
    public string PreferredName { get; private set; }
    public string? Pronouns { get; private set; }
    public bool LessonReminders { get; private set; } = true;
    public bool MentorMessages { get; private set; } = true;
    public bool Announcements { get; private set; }
    public DateTimeOffset StartedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public bool Completed => CompletedAt is not null;

    public void Save(int step, string preferredName, string? pronouns, bool lessonReminders, bool mentorMessages, bool announcements)
    {
        Step = step;
        PreferredName = preferredName;
        Pronouns = pronouns;
        LessonReminders = lessonReminders;
        MentorMessages = mentorMessages;
        Announcements = announcements;
    }

    public void Complete(DateTimeOffset now) => CompletedAt ??= now;
}
