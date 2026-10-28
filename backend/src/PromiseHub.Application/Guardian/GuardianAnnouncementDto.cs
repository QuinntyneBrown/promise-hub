namespace PromiseHub.Application.Guardian;

/// <summary>An announcement as the household reads it: the message's title, the text the household was sent, who sent it, when, and whether it is read (L2-103).</summary>
public sealed record GuardianAnnouncementDto(Guid Id, string Title, string Body, string From, DateTimeOffset SentAt, bool Read);
