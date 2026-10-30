namespace PromiseHub.Application.LearningBond;

/// <summary>A ciphertext that cannot be decrypted: destroyed, altered, or encrypted under another key. The message never carries the value.</summary>
public sealed class LearningBondCipherException(string message) : Exception(message);
