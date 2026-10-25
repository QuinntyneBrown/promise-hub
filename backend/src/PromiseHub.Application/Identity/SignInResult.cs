namespace PromiseHub.Application.Identity;

public sealed record SignInResult(SignInStatus Status, Guid? UserId = null, Guid? MembershipId = null, DateTimeOffset? LockedUntil = null)
{
    public static readonly SignInResult Invalid = new(SignInStatus.Invalid);
}
