namespace PromiseHub.Application.Slips;

/// <summary>Send now, or at <see cref="At"/> when it is in the future.</summary>
public sealed record SendSlipCommand(DateTimeOffset? At);
