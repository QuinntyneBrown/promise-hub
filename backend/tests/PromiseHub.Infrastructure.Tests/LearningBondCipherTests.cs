using System.Security.Cryptography;
using PromiseHub.Application.LearningBond;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Infrastructure.LearningBond;

namespace PromiseHub.Infrastructure.Tests;

// Traces to: L2-159 criteria 1, 2, 6, 7 and 8 (a SIN is encrypted at the field under a key outside the database and seen only as its last three digits).
public sealed class LearningBondCipherTests
{
    // The sample number the Government of Canada publishes for testing; it belongs to no one.
    private const string Sin = "046 454 286";

    private static readonly string Key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    [Fact]
    public void A_SIN_round_trips_and_is_stored_only_as_ciphertext_and_its_last_three_digits()
    {
        var cipher = new LearningBondCipher(Key);

        var encrypted = cipher.Encrypt(Sin);

        Assert.Equal("286", encrypted.Last3);
        Assert.NotNull(encrypted.Ciphertext);
        Assert.DoesNotContain("046454286", encrypted.Ciphertext, StringComparison.Ordinal);
        Assert.DoesNotContain("454", encrypted.Ciphertext, StringComparison.Ordinal);
        Assert.Equal("046454286", cipher.Decrypt(encrypted));
    }

    [Fact]
    public void The_masked_form_and_every_string_of_the_value_carry_only_the_last_three_digits()
    {
        var encrypted = new LearningBondCipher(Key).Encrypt(Sin);

        Assert.Equal("*** *** 286", encrypted.Masked);
        Assert.Equal("*** *** 286", encrypted.ToString());
        Assert.Equal("*** *** 286", $"{encrypted}");
    }

    [Fact]
    public void Encrypting_twice_gives_different_ciphertexts()
    {
        var cipher = new LearningBondCipher(Key);

        Assert.NotEqual(cipher.Encrypt(Sin).Ciphertext, cipher.Encrypt(Sin).Ciphertext);
    }

    [Fact]
    public void An_altered_ciphertext_or_one_from_another_key_is_refused()
    {
        var cipher = new LearningBondCipher(Key);
        var encrypted = cipher.Encrypt(Sin);
        var bytes = Convert.FromBase64String(encrypted.Ciphertext![3..]);
        bytes[^1] ^= 0x01;
        var altered = new EncryptedSin($"v1.{Convert.ToBase64String(bytes)}", encrypted.Last3);
        var other = new LearningBondCipher(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));

        Assert.Throws<LearningBondCipherException>(() => cipher.Decrypt(altered));
        Assert.Throws<LearningBondCipherException>(() => other.Decrypt(encrypted));
    }

    [Fact]
    public void A_destroyed_SIN_keeps_its_last_three_digits_and_cannot_be_decrypted()
    {
        var cipher = new LearningBondCipher(Key);

        var destroyed = cipher.Encrypt(Sin).Destroy();

        Assert.True(destroyed.IsDestroyed);
        Assert.Null(destroyed.Ciphertext);
        Assert.Equal("286", destroyed.Last3);
        Assert.Throws<LearningBondCipherException>(() => cipher.Decrypt(destroyed));
    }

    [Theory]
    [InlineData("046 454 287")]
    [InlineData("04645428")]
    [InlineData("0464542861")]
    [InlineData("046-454-28a")]
    public void A_value_that_is_not_a_valid_SIN_is_refused_without_repeating_it(string value)
    {
        var error = Assert.Throws<ArgumentException>(() => new LearningBondCipher(Key).Encrypt(value));

        Assert.DoesNotContain(value, error.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("04645428", error.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-base64")]
    [InlineData("c2hvcnQ=")]
    public void Without_a_usable_key_the_cipher_is_unavailable_and_encrypts_nothing(string? key)
    {
        var cipher = new LearningBondCipher(key);

        Assert.False(cipher.IsAvailable);
        Assert.Throws<LearningBondUnavailableException>(() => cipher.Encrypt(Sin));
    }
}
