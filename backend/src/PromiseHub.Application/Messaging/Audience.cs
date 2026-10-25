namespace PromiseHub.Application.Messaging;

public sealed record Audience(string Label, IReadOnlyList<Recipient> Recipients);
