using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>
/// A youth's reflection on a lesson (L2-089, ADR 0060): one row per youth membership and lesson, replaced each time she saves. Private
/// unless shared; a shared one is read by her mentor and nobody else.
/// </summary>
public sealed class Reflection : ITenantOwned
{
    public const int MaximumText = 5000;
    public const int MaximumAction = 1000;

    public Reflection(Guid id, Guid organizationId, Guid membershipId, Guid lessonId, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        LessonId = lessonId;
        Text = string.Empty;
        CreatedAt = createdAt;
        SavedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public Guid LessonId { get; private set; }
    public ReflectionMood Mood { get; private set; }
    public string Text { get; private set; }

    /// <summary>One thing she'll do this week, optional.</summary>
    public string? Action { get; private set; }
    public bool Shared { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset SavedAt { get; private set; }

    public void Save(ReflectionMood mood, string text, string? action, bool shared, DateTimeOffset now)
    {
        Mood = mood;
        Text = text;
        Action = action;
        Shared = shared;
        SavedAt = now;
    }
}
