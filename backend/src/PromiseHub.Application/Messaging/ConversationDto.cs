namespace PromiseHub.Application.Messaging;

/// <summary>
/// One conversation (L2-106 criterion 2, L2-108): both names, whether the reader may write, why it is blocked, and every message oldest
/// first; read only for a supervisor.
/// </summary>
public sealed record ConversationDto(Guid YouthId, string YouthName, Guid? MentorId, string? MentorName, bool ReadOnly, bool CanSend, string? Blocked,
    IReadOnlyList<DirectMessageDto> Messages);
