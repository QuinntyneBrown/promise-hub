using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>
/// A mentor's record of one conversation with a youth (L2-090, ADR 0061): read only by the mentor who wrote it. Private unless shared;
/// private notes are never part of a shared view. Logged once, never edited.
/// </summary>
public sealed class MentorCheckIn : ITenantOwned
{
    public const int MaximumText = 2000;

    public MentorCheckIn(Guid id, Guid organizationId, Guid childId, Guid mentorMembershipId, DateOnly date, MentorCheckInKind kind,
        MentorCheckInEngagement engagement, string? topics, string? actionItems, string? privateNotes, DateOnly? followUpOn, bool shared,
        bool guardianInformed, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        MentorMembershipId = mentorMembershipId;
        Date = date;
        Kind = kind;
        Engagement = engagement;
        Topics = topics;
        ActionItems = actionItems;
        PrivateNotes = privateNotes;
        FollowUpOn = followUpOn;
        Shared = shared;
        GuardianInformed = guardianInformed;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid MentorMembershipId { get; private set; }
    public DateOnly Date { get; private set; }
    public MentorCheckInKind Kind { get; private set; }
    public MentorCheckInEngagement Engagement { get; private set; }
    public string? Topics { get; private set; }
    public string? ActionItems { get; private set; }
    public string? PrivateNotes { get; private set; }
    public DateOnly? FollowUpOn { get; private set; }
    public bool Shared { get; private set; }
    public bool GuardianInformed { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
