namespace PromiseHub.Application.Messaging;

/// <summary>The reader's conversations, the latest message first.</summary>
public sealed record ConversationListDto(IReadOnlyList<ConversationRowDto> Conversations);
