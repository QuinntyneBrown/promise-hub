namespace PromiseHub.Application.Events;

/// <summary>The outcome of creating an event: the result and, when created, how many sessions were saved (one, or a weekly series).</summary>
public sealed record EventCreation(Result Result, int Count);
