namespace PromiseHub.Application.Mentoring;

/// <summary>An approval: blank approves the auto-score, otherwise a whole percentage from 0 to 100 (L2-081 criterion 2).</summary>
public sealed record ApproveQuizRequest(int? Override);
