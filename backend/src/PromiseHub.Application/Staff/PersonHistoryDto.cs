namespace PromiseHub.Application.Staff;

/// <summary>One audit entry about the account: when, the action, what it says and who did it.</summary>
public sealed record PersonHistoryDto(DateTimeOffset At, string Action, string Summary, string By);
