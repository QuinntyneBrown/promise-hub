namespace PromiseHub.Application.LearningBond;

/// <summary>GET /g/learning-bond/{token}/agent/conversation: the household's own conversation with the agent (L2-160 criterion 6).</summary>
public sealed record LearningBondConversationDto(IReadOnlyList<LearningBondAgentMessageDto> Messages);
