namespace PromiseHub.Application.Identity;

public enum SignInStatus
{
    SignedIn,
    MfaRequired,
    Invalid,
    Locked,
}
