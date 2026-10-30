using System.Security.Cryptography;
using System.Text;
using PromiseHub.Application.LearningBond;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>
/// AES-256-GCM under the Learning Bond key (L2-159, ADR 0076). The key is 32 bytes, base64, read from <c>LearningBond:Key</c> in configuration
/// or a key vault and never stored in the database. A ciphertext is "v1." and base64 of nonce, tag and encrypted digits, bound to its purpose.
/// </summary>
public sealed class LearningBondCipher : ILearningBondCipher
{
    private const string Version = "v1.";
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private static readonly byte[] Purpose = Encoding.UTF8.GetBytes("PromiseHub.LearningBond.SIN");

    private readonly byte[]? _key;

    public LearningBondCipher(string? key)
    {
        _key = Parse(key);
    }

    public bool IsAvailable => _key is not null;

    public EncryptedSin Encrypt(string sin)
    {
        var key = _key ?? throw new LearningBondUnavailableException();
        var digits = SocialInsuranceNumber.Normalize(sin) ?? throw new ArgumentException("This is not a valid social insurance number.", nameof(sin));
        var plain = Encoding.ASCII.GetBytes(digits);
        var output = new byte[NonceSize + TagSize + plain.Length];
        var nonce = output.AsSpan(0, NonceSize);
        RandomNumberGenerator.Fill(nonce);
        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, plain, output.AsSpan(NonceSize + TagSize), output.AsSpan(NonceSize, TagSize), Purpose);
        CryptographicOperations.ZeroMemory(plain);
        return new EncryptedSin(Version + Convert.ToBase64String(output), digits[^3..]);
    }

    public string Decrypt(EncryptedSin sin)
    {
        var key = _key ?? throw new LearningBondUnavailableException();
        if (sin.Ciphertext is not { } ciphertext || !ciphertext.StartsWith(Version, StringComparison.Ordinal))
        {
            throw new LearningBondCipherException("The social insurance number was destroyed or is not a Learning Bond ciphertext.");
        }
        try
        {
            var input = Convert.FromBase64String(ciphertext[Version.Length..]);
            var plain = new byte[input.Length - NonceSize - TagSize];
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(input.AsSpan(0, NonceSize), input.AsSpan(NonceSize + TagSize), input.AsSpan(NonceSize, TagSize), plain, Purpose);
            return Encoding.ASCII.GetString(plain);
        }
        catch (Exception e) when (e is CryptographicException or FormatException or OverflowException or ArgumentException)
        {
            throw new LearningBondCipherException("The social insurance number could not be decrypted under the Learning Bond key.");
        }
    }

    private static byte[]? Parse(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return null;
        }
        try
        {
            var bytes = Convert.FromBase64String(key);
            return bytes.Length == 32 ? bytes : null;
        }
        catch (FormatException)
        {
            return null;
        }
    }
}
