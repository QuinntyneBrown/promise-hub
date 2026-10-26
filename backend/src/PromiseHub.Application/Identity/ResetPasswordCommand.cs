namespace PromiseHub.Application.Identity;

public sealed record ResetPasswordCommand(string? Token, string? Password, string? Repeat);
