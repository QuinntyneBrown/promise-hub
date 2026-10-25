using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Messaging;

/// <summary>One copy of a message to one household over one channel. Sent at most once; failures retry with backoff.</summary>
public sealed class Delivery : ITenantOwned
{
    public const int MaxAttempts = 3;

    public Delivery(
        Guid id,
        Guid organizationId,
        Guid messageId,
        Guid householdId,
        string household,
        string? guardian,
        string language,
        Channel channel,
        string? to,
        string? fallbackEmail,
        DateTimeOffset dueAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MessageId = messageId;
        HouseholdId = householdId;
        Household = household;
        Guardian = guardian;
        Language = language;
        Channel = channel;
        To = to;
        FallbackEmail = fallbackEmail;
        DueAt = dueAt;
        Status = DeliveryStatus.Queued;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MessageId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string Household { get; private set; }
    public string? Guardian { get; private set; }
    public string Language { get; private set; }
    public Channel Channel { get; private set; }

    /// <summary>The mobile number or email address; null when the household has no way to receive the chosen channel.</summary>
    public string? To { get; private set; }

    /// <summary>Where a text goes instead when the SMS cap refuses it; only for "text, email for households without a mobile".</summary>
    public string? FallbackEmail { get; private set; }

    public DeliveryStatus Status { get; private set; }
    public string? Reason { get; private set; }
    public int Attempts { get; private set; }
    public DateTimeOffset DueAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }

    public void Sent(DateTimeOffset at)
    {
        Status = DeliveryStatus.Sent;
        SentAt = at;
        Attempts++;
    }

    public void SentByEmailInstead(DateTimeOffset at)
    {
        Status = DeliveryStatus.FellBackToEmail;
        Channel = Channel.Email;
        To = FallbackEmail;
        Reason = "SMS cap reached";
        SentAt = at;
    }

    public void Pause(string reason)
    {
        Status = DeliveryStatus.Paused;
        Reason = reason;
    }

    public void Fail(string reason)
    {
        Status = DeliveryStatus.Failed;
        Reason = reason;
    }

    /// <summary>A refused send: tried again after 2, 4 … minutes, failed for good after <see cref="MaxAttempts"/>.</summary>
    public void Refused(DateTimeOffset now, string reason)
    {
        Attempts++;
        if (Attempts >= MaxAttempts)
        {
            Fail(reason);
            return;
        }
        DueAt = now.AddMinutes(Math.Pow(2, Attempts));
    }
}
