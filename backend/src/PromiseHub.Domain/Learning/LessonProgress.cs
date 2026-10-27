using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>A lesson a youth has done (L2-069, ADR 0051): one row per youth membership and lesson, kept when the lesson or the module is turned off.</summary>
public sealed class LessonProgress : ITenantOwned
{
    public LessonProgress(Guid id, Guid organizationId, Guid membershipId, Guid lessonId, DateTimeOffset completedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        LessonId = lessonId;
        CompletedAt = completedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public Guid LessonId { get; private set; }
    public DateTimeOffset CompletedAt { get; private set; }
}
