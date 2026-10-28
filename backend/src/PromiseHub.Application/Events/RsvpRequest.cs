namespace PromiseHub.Application.Events;

/// <summary>Going, Maybe or CantMake, and an optional note of at most 500 characters.</summary>
public sealed record RsvpRequest(string? Response, string? Note);
