using System.Security.Cryptography;
using System.Text;
using PromiseHub.Application.Attendance;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Inbound texts from the SMS provider: anonymous, but only with the shared secret from configuration (Sms:InboundSecret).
/// The answer is 200 whether or not the text matched an alert, so the provider never retries and nothing is disclosed.
/// </summary>
public static class SmsWebhookEndpoints
{
    public static IEndpointRouteBuilder MapSmsWebhookEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/webhooks/sms/inbound", async (InboundSmsCommand command, HttpContext http, IConfiguration config, NoShowReplyHandler handler, CancellationToken ct) =>
        {
            var secret = config["Sms:InboundSecret"];
            var sent = http.Request.Headers["X-Webhook-Secret"].ToString();
            if (string.IsNullOrEmpty(secret) || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(sent)))
            {
                return Results.Unauthorized();
            }
            await handler.HandleAsync(command, ct);
            return Results.Ok();
        }).AllowAnonymous();
        return app;
    }
}
