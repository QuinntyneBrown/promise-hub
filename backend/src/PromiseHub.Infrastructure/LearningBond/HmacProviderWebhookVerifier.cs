using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>
/// Checks the X-PromiseHub-Signature header, "sha256=" and the hex HMAC-SHA256 of the body under the provider's secret from configuration
/// (LearningBond:Webhooks:{channel}). A provider with no secret configured is never trusted.
/// </summary>
public sealed class HmacProviderWebhookVerifier(IConfiguration configuration) : IProviderWebhookVerifier
{
    public bool Verify(string channel, string body, string? signature)
    {
        var secret = configuration[$"LearningBond:Webhooks:{channel}"];
        if (string.IsNullOrEmpty(secret) || signature is null || !signature.StartsWith("sha256=", StringComparison.Ordinal))
        {
            return false;
        }
        var expected = Encoding.ASCII.GetBytes(Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body))));
        return CryptographicOperations.FixedTimeEquals(expected, Encoding.ASCII.GetBytes(signature["sha256=".Length..].ToLowerInvariant()));
    }
}
