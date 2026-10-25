using System.Security.Cryptography;
using PromiseHub.Application.Identity;

namespace PromiseHub.Infrastructure.Auth;

/// <summary>RFC 6238 time-based codes: SHA-1, 30-second steps, six digits, one step of clock drift either way.</summary>
public sealed class TotpVerifier(TimeProvider clock) : ITotpVerifier
{
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public bool Verify(string base32Secret, string code)
    {
        if (code.Length != 6 || !code.All(char.IsAsciiDigit))
        {
            return false;
        }
        var key = Decode(base32Secret);
        var step = clock.GetUtcNow().ToUnixTimeSeconds() / 30;
        return new[] { step - 1, step, step + 1 }.Any(s => CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.ASCII.GetBytes(CodeAt(key, s)), System.Text.Encoding.ASCII.GetBytes(code)));
    }

    private static string CodeAt(byte[] key, long step)
    {
        var message = BitConverter.GetBytes(step);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(message);
        }
        var hash = HMACSHA1.HashData(key, message);
        var offset = hash[^1] & 0x0f;
        var binary = ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3];
        return (binary % 1_000_000).ToString("D6");
    }

    private static byte[] Decode(string base32)
    {
        var bytes = new List<byte>();
        int buffer = 0, bits = 0;
        foreach (var c in base32.TrimEnd('=').ToUpperInvariant())
        {
            buffer = (buffer << 5) | Alphabet.IndexOf(c);
            bits += 5;
            if (bits >= 8)
            {
                bits -= 8;
                bytes.Add((byte)(buffer >> bits));
                buffer &= (1 << bits) - 1;
            }
        }
        return [.. bytes];
    }
}
