namespace PromiseHub.Application.Messaging;

/// <summary>
/// What changed, without its content (L2-107 criterion 3): <c>conversation</c> names the youth's conversation, <c>announcement</c> names
/// nothing. The page fetches the change through the permission-checked endpoint.
/// </summary>
public sealed record RealtimeEvent(string Type, Guid? YouthId = null);
