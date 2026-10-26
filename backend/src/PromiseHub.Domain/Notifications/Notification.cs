using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Notifications;

/// <summary>
/// An in-app notice for one staff member (L2-040): what happened, where to act on it, and when they read it. The kind names
/// the module it belongs to, so notices of a module that is off are hidden, never deleted.
/// </summary>
public sealed class Notification : ITenantOwned
{
    public Notification(Guid id, Guid organizationId, Guid membershipId, string kind, string text, string link, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        Kind = kind;
        Text = text;
        Link = link;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public string Kind { get; private set; }
    public string Text { get; private set; }
    public string Link { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? ReadAt { get; private set; }

    public void Read(DateTimeOffset now) => ReadAt ??= now;
}
