namespace PromiseHub.Application.Attendance;

/// <summary>A text a guardian sent back, as the SMS provider forwards it.</summary>
public sealed record InboundSmsCommand(string? From, string? Text);
