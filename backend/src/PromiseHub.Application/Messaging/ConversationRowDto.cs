namespace PromiseHub.Application.Messaging;

/// <summary>One conversation on the list (L2-106 criterion 1): who, the last message, how many the reader has not read, and why it is blocked.</summary>
public sealed record ConversationRowDto(Guid YouthId, string YouthName, Guid? MentorId, string? MentorName, string? LastMessage, bool LastMessageMine,
    DateTimeOffset? LastMessageAt, int Unread, string? Blocked);
