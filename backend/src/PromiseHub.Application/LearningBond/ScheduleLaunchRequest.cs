namespace PromiseHub.Application.LearningBond;

/// <summary>Choose how invitations go out (L2-140): "Scheduled" with a date, or "AtTheDoor".</summary>
public sealed record ScheduleLaunchRequest(string? Mode, DateOnly? Date);
