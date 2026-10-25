namespace PromiseHub.Application.Slips;

/// <summary>An edit of a sent slip; <see cref="Material"/> re-opens signing for everyone.</summary>
public sealed record EditSlipCommand(string? Title, string? Body, DateOnly SignBy, bool Material);
