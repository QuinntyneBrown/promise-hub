namespace PromiseHub.Application.Learning;

/// <summary>The attempt a youth has in progress and how many of its questions she has answered (L2-075 criterion 1).</summary>
public sealed record InProgressDto(Guid AttemptId, int Number, int Answered);
