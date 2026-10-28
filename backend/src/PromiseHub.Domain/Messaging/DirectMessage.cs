using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Messaging;

/// <summary>
/// One message between a youth and her mentor (L2-106, L2-108, ADR 0068). Kept as written: never edited or deleted. The body is plain
/// text and is never rendered as markup.
/// </summary>
public sealed class DirectMessage : ITenantOwned
{
    public const int MaximumBody = 2000;

    public DirectMessage(Guid id, Guid organizationId, Guid youthMembershipId, Guid mentorMembershipId, Guid senderMembershipId, string body,
        DateTimeOffset sentAt)
    {
        Id = id;
        OrganizationId = organizationId;
        YouthMembershipId = youthMembershipId;
        MentorMembershipId = mentorMembershipId;
        SenderMembershipId = senderMembershipId;
        Body = body;
        SentAt = sentAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid YouthMembershipId { get; private set; }
    public Guid MentorMembershipId { get; private set; }
    public Guid SenderMembershipId { get; private set; }
    public string Body { get; private set; }
    public DateTimeOffset SentAt { get; private set; }

    /// <summary>When the other participant read it; null while it is new to them.</summary>
    public DateTimeOffset? ReadAt { get; private set; }

    public void MarkRead(DateTimeOffset at) => ReadAt ??= at;
}
