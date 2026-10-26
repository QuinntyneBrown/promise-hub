using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Identity;

/// <summary>
/// The sign-in lock of L2-047: an email is locked while it has <see cref="SignInPolicy.MaxFailures"/> consecutive failures,
/// counted inside the window after its last success.
/// </summary>
public static class SignInLock
{
    /// <summary>The times of the consecutive failures inside the window, newest first.</summary>
    public static async Task<List<DateTimeOffset>> ConsecutiveFailuresAsync(IPromiseHubDb db, string email, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var since = now - SignInPolicy.Window;
        var attempts = (await db.SignInAttempts
            .Where(a => a.Email == email)
            .Select(a => new { a.At, a.Succeeded })
            .ToListAsync(cancellationToken))
            .Where(a => a.At > since)
            .ToList();
        // Only failures after the last success count; a success at the same instant clears them too.
        var lastSuccess = attempts.Where(a => a.Succeeded).Select(a => (DateTimeOffset?)a.At).Max();
        return [.. attempts.Where(a => !a.Succeeded && (lastSuccess is null || a.At > lastSuccess)).Select(a => a.At).OrderDescending()];
    }

    public static bool IsLocked(IReadOnlyCollection<DateTimeOffset> failures) => failures.Count >= SignInPolicy.MaxFailures;

    /// <summary>When a lock that starts with these failures ends.</summary>
    public static DateTimeOffset Until(IReadOnlyCollection<DateTimeOffset> failures) => failures.Max() + SignInPolicy.Window;
}
