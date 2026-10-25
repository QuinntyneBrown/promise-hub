using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Slips;

/// <summary>
/// An event's permission slip. Created as a draft when an event needs one (L2-012 criterion 2); written, sent, scheduled
/// and edited in Slips (L2-014). A material edit after sending starts a new version that everyone signs again.
/// </summary>
public sealed class PermissionSlip : ITenantOwned
{
    public const int MaxBodyLength = 600;

    public PermissionSlip(Guid id, Guid organizationId, Guid eventId, DateOnly signBy)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        SignBy = signBy;
        Status = SlipStatus.Draft;
        Title = string.Empty;
        Body = string.Empty;
        AskPhotos = true;
        AskLunch = true;
        Reminders = SlipReminders.TwiceWeekly;
        Channel = SlipChannel.TextAndEmail;
        Version = 1;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public string Title { get; private set; }
    public string Body { get; private set; }
    public DateOnly SignBy { get; private set; }
    public bool AskPhotos { get; private set; }
    public bool AskSwimming { get; private set; }
    public bool AskLunch { get; private set; }
    public SlipReminders Reminders { get; private set; }
    public SlipChannel Channel { get; private set; }
    public SlipStatus Status { get; private set; }
    public DateTimeOffset? ScheduledFor { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }
    public int Version { get; private set; }

    /// <summary>The most recent message that carried the slip to guardians.</summary>
    public Guid? MessageId { get; private set; }

    public void Write(string title, string body, DateOnly signBy, bool askPhotos, bool askSwimming, bool askLunch, SlipReminders reminders, SlipChannel channel)
    {
        Title = title;
        Body = body;
        SignBy = signBy;
        AskPhotos = askPhotos;
        AskSwimming = askSwimming;
        AskLunch = askLunch;
        Reminders = reminders;
        Channel = channel;
    }

    public void Schedule(DateTimeOffset at)
    {
        Status = SlipStatus.Scheduled;
        ScheduledFor = at;
    }

    public void CancelSchedule()
    {
        Status = SlipStatus.Draft;
        ScheduledFor = null;
    }

    public void Sent(DateTimeOffset at, Guid messageId)
    {
        Status = SlipStatus.Sent;
        ScheduledFor = null;
        SentAt = at;
        MessageId = messageId;
    }

    /// <summary>Changes the text of a sent slip; a material change starts a new version.</summary>
    public void Edit(string title, string body, DateOnly signBy, bool material)
    {
        Title = title;
        Body = body;
        SignBy = signBy;
        if (material)
        {
            Version++;
        }
    }

    public void Resent(Guid messageId) => MessageId = messageId;
}
