namespace PromiseHub.Application.Messaging;

/// <summary>The words of a direct message (L2-106 criterion 3).</summary>
public sealed record SendDirectMessageRequest(string? Body);
