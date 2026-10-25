namespace PromiseHub.Application.Slips;

/// <summary>How the latest send went: households reached, sent by email because of the SMS cap, paused or failed.</summary>
public sealed record SlipDeliveryDto(int Sent, IReadOnlyList<string> EmailInstead, IReadOnlyList<string> Paused, IReadOnlyList<string> Failed);
