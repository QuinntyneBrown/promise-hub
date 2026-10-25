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
}
