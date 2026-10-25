using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Messaging;

/// <summary>A message to the guardians of a set of households; one <see cref="Delivery"/> per household.</summary>
public sealed class Message : ITenantOwned
{
    public Message(
        Guid id,
        Guid organizationId,
        string title,
        string body,
        ChannelChoice channel,
        string audience,
        Guid? programId,
        Guid? eventId,
        string? language,
        int recipientCount,
        DateTimeOffset createdAt,
        string createdBy)
    {
        Id = id;
        OrganizationId = organizationId;
        Title = title;
        Body = body;
        Channel = channel;
        Audience = audience;
        ProgramId = programId;
        EventId = eventId;
        Language = language;
        RecipientCount = recipientCount;
        CreatedAt = createdAt;
        CreatedBy = createdBy;
        Status = MessageStatus.Sending;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Title { get; private set; }
    public string Body { get; private set; }
    public ChannelChoice Channel { get; private set; }

    /// <summary>The audience as staff chose it, for example "After-School Tutoring · Spanish households".</summary>
    public string Audience { get; private set; }

    public Guid? ProgramId { get; private set; }
    public Guid? EventId { get; private set; }
    public string? Language { get; private set; }
    public int RecipientCount { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public string CreatedBy { get; private set; }
    public MessageStatus Status { get; private set; }

    public void MarkSent() => Status = MessageStatus.Sent;

    /// <summary>The first sentence of the body, or its first 60 characters.</summary>
    public static string TitleFrom(string body)
    {
        var text = body.Trim();
        var end = text.IndexOfAny(['.', '!', '?']);
        if (end is > 0 and < 60)
        {
            return text[..(end + 1)];
        }
        return text.Length <= 60 ? text : $"{text[..59].TrimEnd()}…";
    }
}
