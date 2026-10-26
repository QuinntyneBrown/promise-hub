namespace PromiseHub.Application.Identity;

/// <summary>Your account (`account`): who you are here, and the state of two-step sign-in.</summary>
public sealed record AccountDto(string Name, string Email, string Role, string Organization, string? Mobile, bool TwoStepOn, int RecoveryCodesLeft);
