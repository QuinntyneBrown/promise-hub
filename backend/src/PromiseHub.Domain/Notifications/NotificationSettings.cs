using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Notifications;

/// <summary>
/// An organization's notification preferences (L2-040): when a no-show text goes out, whether supervisors are emailed about
/// new incidents, and its own monthly SMS cap. An organization without a row uses the defaults.
/// </summary>
public sealed class NotificationSettings : ITenantOwned
{
    public const int DefaultNoShowDelayMinutes = 15;
    public const int MinNoShowDelayMinutes = 5;
    public const int MaxNoShowDelayMinutes = 60;

    public NotificationSettings(Guid id, Guid organizationId)
    {
        Id = id;
        OrganizationId = organizationId;
        NoShowDelayMinutes = DefaultNoShowDelayMinutes;
        EmailSupervisorsOnIncidents = true;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public int NoShowDelayMinutes { get; private set; }
    public bool EmailSupervisorsOnIncidents { get; private set; }

    /// <summary>The monthly SMS cap; null uses the plan's.</summary>
    public int? SmsCap { get; private set; }

    public void Change(int noShowDelayMinutes, bool emailSupervisorsOnIncidents, int smsCap)
    {
        NoShowDelayMinutes = noShowDelayMinutes;
        EmailSupervisorsOnIncidents = emailSupervisorsOnIncidents;
        SmsCap = smsCap;
    }
}
