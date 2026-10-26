namespace PromiseHub.Application.Identity;

public enum SignInStatus
{
    SignedIn,
    MfaRequired,
    Invalid,
    Locked,

    /// <summary>The password is right but every membership was removed (L2-050).</summary>
    Deactivated,
}
