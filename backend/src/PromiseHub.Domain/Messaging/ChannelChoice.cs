namespace PromiseHub.Domain.Messaging;

/// <summary>How a message reaches households: by text with email for households without a mobile, by email only, or by text only.</summary>
public enum ChannelChoice
{
    TextWithEmailFallback,
    EmailOnly,
    TextOnly,
}
