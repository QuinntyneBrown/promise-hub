namespace PromiseHub.Domain.Messaging;

/// <summary>Which module a message belongs to; it is sent only while that module is on.</summary>
public enum MessageSource
{
    Messages,
    Slips,
}
