namespace PromiseHub.Infrastructure.Persistence.Seed;

/// <summary>Secrets for seeded staff, read from configuration (Seed:StaffPassword, Seed:MfaSecret), never from source.</summary>
public sealed record SeedOptions(string? StaffPassword, string? MfaSecret)
{
    public static readonly SeedOptions None = new(null, null);
}
