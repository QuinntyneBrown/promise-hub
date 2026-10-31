using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Encrypts a SIN at the field under the Learning Bond key, which lives in configuration or a key vault and never in the database (L2-159,
/// ADR 0076). The only caller allowed to decrypt is the submission of an application the guardian submitted.
/// </summary>
public interface ILearningBondCipher
{
    /// <summary>False when no usable key is configured; intake and submission then answer 503 and store nothing (L2-159 criterion 6).</summary>
    bool IsAvailable { get; }

    /// <summary>Validates and encrypts a SIN. Throws <see cref="ArgumentException"/> for a value that is not a SIN, without repeating it.</summary>
    EncryptedSin Encrypt(string sin);

    /// <summary>The nine digits. Throws <see cref="LearningBondCipherException"/> when destroyed, altered or under another key.</summary>
    string Decrypt(EncryptedSin sin);

    /// <summary>A document the provider asked for, encrypted under the same key with its own purpose (L2-150 criterion 6, L2-159).</summary>
    byte[] EncryptDocument(byte[] content);

    byte[] DecryptDocument(byte[] ciphertext);
}
