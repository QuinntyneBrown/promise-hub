using System.Security.Cryptography;
using System.Text;

namespace PromiseHub.Application.Guardian;

/// <summary>Link and device tokens of 256 random bits, six-digit codes, and the hashes that are all PromiseHub keeps.</summary>
public static class GuardianTokens
{
    public static string New() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public static string NewCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", System.Globalization.CultureInfo.InvariantCulture);

    public static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
