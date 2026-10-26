namespace PromiseHub.Api.Authentication;

public static class AuthSchemes
{
    /// <summary>The staff session: HttpOnly, Secure, SameSite=Strict, 12 hours sliding.</summary>
    public const string Session = "PromiseHub.Session";

    /// <summary>A five-minute ticket between the password step and the second factor; grants nothing else.</summary>
    public const string MfaPending = "PromiseHub.MfaPending";

    public const string MembershipClaim = "membership_id";
    public const string UserClaim = "user_id";
    public const string SessionVersionClaim = "session_version";
}
