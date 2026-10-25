namespace PromiseHub.Application.Slips;

/// <summary>A staff-written reminder; {child} and {link} fill in per family.</summary>
public sealed record RemindNowCommand(string? Body);
