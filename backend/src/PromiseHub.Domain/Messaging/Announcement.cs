using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Messaging;

/// <summary>
/// An announcement to one program or the whole organization (L2-105, ADR 0068). It is visible from <see cref="SendAt"/>; before then it is
/// scheduled. Guardians are reached through a Messages copy (<see cref="GuardianMessageId"/>), never in the app.
/// </summary>
public sealed class Announcement : ITenantOwned
{
    public const int MaximumTitle = 120;
    public const int MaximumBody = 2000;

    public Announcement(Guid id, Guid organizationId, string title, string body, Guid? programId, AnnouncementAudience audience,
        DateTimeOffset sendAt, DateTimeOffset createdAt, Guid createdByMembershipId, string createdBy, Role createdByRole)
    {
        Id = id;
        OrganizationId = organizationId;
        Title = title;
        Body = body;
        ProgramId = programId;
        Audience = audience;
        SendAt = sendAt;
        CreatedAt = createdAt;
        CreatedByMembershipId = createdByMembershipId;
        CreatedBy = createdBy;
        CreatedByRole = createdByRole;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Title { get; private set; }
    public string Body { get; private set; }

    /// <summary>The program it is for; null for all programs.</summary>
    public Guid? ProgramId { get; private set; }

    public AnnouncementAudience Audience { get; private set; }
    public DateTimeOffset SendAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public Guid CreatedByMembershipId { get; private set; }
    public string CreatedBy { get; private set; }
    public Role CreatedByRole { get; private set; }

    /// <summary>The Messages-module message carrying the guardians' copy; null when the audience has no guardians.</summary>
    public Guid? GuardianMessageId { get; private set; }

    public bool ReachesYouth => Audience is AnnouncementAudience.Youth or AnnouncementAudience.YouthAndGuardians or AnnouncementAudience.Everyone;
    public bool ReachesMentors => Audience is AnnouncementAudience.Mentors or AnnouncementAudience.Everyone;
    public bool ReachesGuardians => Audience is AnnouncementAudience.Guardians or AnnouncementAudience.YouthAndGuardians or AnnouncementAudience.Everyone;

    public void CopiedToGuardians(Guid messageId) => GuardianMessageId = messageId;
}
