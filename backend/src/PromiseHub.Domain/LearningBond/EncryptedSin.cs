namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A social insurance number as stored (L2-159): the ciphertext under the Learning Bond key and the last three digits. The clear text never
/// lives here. Once destroyed only the last three digits remain. <see cref="ToString"/> answers the masked form, so a log line or an
/// interpolated message can never carry the number.
/// </summary>
public sealed record EncryptedSin
{
    public EncryptedSin(string? ciphertext, string last3)
    {
        if (last3.Length != 3 || !last3.All(char.IsAsciiDigit))
        {
            throw new ArgumentException("The last three digits must be three digits.", nameof(last3));
        }
        Ciphertext = ciphertext;
        Last3 = last3;
    }

    public string? Ciphertext { get; }

    public string Last3 { get; }

    public bool IsDestroyed => Ciphertext is null;

    /// <summary>The only form a person ever sees: "*** *** 123".</summary>
    public string Masked => $"*** *** {Last3}";

    /// <summary>Drops the ciphertext and keeps the last three digits.</summary>
    public EncryptedSin Destroy() => new(null, Last3);

    public override string ToString() => Masked;
}
