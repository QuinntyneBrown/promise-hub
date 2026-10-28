namespace PromiseHub.Application.Messaging;

/// <summary>A send: created with the message, refused (404, 403, 422) or blocked by a safeguard (409 with the reason).</summary>
public sealed record SendDirectMessageOutcome(Result Result, DirectMessageDto? Message = null, string? Blocked = null);
