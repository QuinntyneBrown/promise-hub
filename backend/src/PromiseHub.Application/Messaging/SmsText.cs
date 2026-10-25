namespace PromiseHub.Application.Messaging;

/// <summary>A text as guardians receive it: the organization's name first, so they know who it is from.</summary>
public static class SmsText
{
    public static string For(string organizationName, string body) => $"{organizationName}: {body.Trim()}";
}
