namespace PromiseHub.Application.Messaging;

/// <summary>One message as the reader sees it (L2-106 criterion 2): its words as plain text, who sent it, whether it is hers and when.</summary>
public sealed record DirectMessageDto(Guid Id, string Body, string From, bool Mine, DateTimeOffset SentAt);
