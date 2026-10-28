using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Notifications;

/// <summary>
/// One member's choice for one kind of notification in one organization (L2-111, ADR 0069): whether it reaches them in the app. Only what
/// a member changed is stored; a kind without a row is on.
/// </summary>
public sealed class NotificationPreference : ITenantOwned
{
    public NotificationPreference(Guid id, Guid organizationId, Guid membershipId, string kind, bool inApp)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        Kind = kind;
        InApp = inApp;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public string Kind { get; private set; }
    public bool InApp { get; private set; }

    public void Change(bool inApp) => InApp = inApp;
}
