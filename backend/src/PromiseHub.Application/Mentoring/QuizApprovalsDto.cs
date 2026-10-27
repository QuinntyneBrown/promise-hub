namespace PromiseHub.Application.Mentoring;

/// <summary>The quiz results waiting for the mentor's approval, oldest first.</summary>
public sealed record QuizApprovalsDto(IReadOnlyList<QuizApprovalItemDto> Items);
