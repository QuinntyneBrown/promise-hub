namespace PromiseHub.Application.Messaging;

/// <summary>State is "Ok" or "Reached".</summary>
public sealed record SmsCapDto(int Cap, int Used, int Remaining, string State, string Period);
