namespace PromiseHub.Domain.Identity;

/// <summary>A person who signs in. Not tenant-owned: one person may hold memberships in several organizations.</summary>
public sealed class StaffUser
{
    public StaffUser(Guid id, string email, string? passwordHash, string? mfaSecret)
    {
        Id = id;
        Email = email;
        PasswordHash = passwordHash;
        MfaSecret = mfaSecret;
    }

    public Guid Id { get; private set; }
    public string Email { get; private set; }
    public string? PasswordHash { get; private set; }

    /// <summary>Base32 TOTP secret when the person has enrolled an authenticator app.</summary>
    public string? MfaSecret { get; private set; }

    /// <summary>Hashes of the unused recovery codes, separated by semicolons; null before any are made.</summary>
    public string? RecoveryCodes { get; private set; }

    /// <summary>Rises when the person signs out everywhere; a session cookie carrying an older version is refused.</summary>
    public int SessionVersion { get; private set; }

    /// <summary>Runs the PromiseHub service itself: lists, adds and suspends organizations (L2-003). Not tenant-owned.</summary>
    public bool IsPlatformAdmin { get; private set; }

    public void MakePlatformAdmin() => IsPlatformAdmin = true;

    public int RecoveryCodesLeft => string.IsNullOrEmpty(RecoveryCodes) ? 0 : RecoveryCodes.Split(';').Length;

    public void ReplaceRecoveryCodes(IEnumerable<string> hashes) => RecoveryCodes = string.Join(';', hashes);

    public void EndOtherSessions() => SessionVersion++;

    public void ChangePassword(string hash) => PasswordHash = hash;
}
