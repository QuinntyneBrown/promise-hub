using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Identity;

/// <summary>The sign-in rules of L2-006.</summary>
public static class SignInPolicy
{
    public const int MaxFailures = 5;
    public static readonly TimeSpan Window = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan IdleTimeout = TimeSpan.FromHours(12);

    /// <summary>Roles that must complete a second factor once enrolled.</summary>
    public static bool RequiresMfa(Role role) => role is Role.Admin or Role.ProgramDirector;

    public static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
