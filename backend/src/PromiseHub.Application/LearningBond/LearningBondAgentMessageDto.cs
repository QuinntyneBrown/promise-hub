namespace PromiseHub.Application.LearningBond;

/// <summary>One message of the household's conversation with the agent.</summary>
public sealed record LearningBondAgentMessageDto(string Role, string Text, string Step, DateTimeOffset At);
