namespace PromiseHub.Application.Messaging;

public sealed record SendResult(bool Ok)
{
    public static readonly SendResult Accepted = new(true);
    public static readonly SendResult Refused = new(false);
}
