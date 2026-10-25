namespace PromiseHub.Domain.Messaging;

public enum DeliveryStatus
{
    Queued,
    Sent,

    /// <summary>The text was refused by the SMS cap and the household was emailed instead.</summary>
    FellBackToEmail,

    /// <summary>The text was refused by the SMS cap and the household has no email.</summary>
    Paused,
    Failed,
}
