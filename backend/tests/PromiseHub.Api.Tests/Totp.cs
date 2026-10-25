using System.Security.Cryptography;

namespace PromiseHub.Api.Tests;

/// <summary>RFC 6238 codes computed independently of the production verifier, as an authenticator app would.</summary>
public static class Totp
{
    public static string Code(string base32Secret, DateTimeOffset at)
    {
        var counter = at.ToUnixTimeSeconds() / 30;
        var message = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(message);
        }
        var hash = HMACSHA1.HashData(Base32(base32Secret), message);
        var offset = hash[^1] & 0x0f;
        var binary = ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3];
        return (binary % 1_000_000).ToString("D6");
    }

    private static byte[] Base32(string text)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bits = string.Concat(text.TrimEnd('=').Select(c => Convert.ToString(alphabet.IndexOf(c), 2).PadLeft(5, '0')));
        return [.. Enumerable.Range(0, bits.Length / 8).Select(i => Convert.ToByte(bits.Substring(i * 8, 8), 2))];
    }
}
