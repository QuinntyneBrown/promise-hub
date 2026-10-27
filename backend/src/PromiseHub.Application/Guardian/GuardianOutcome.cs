namespace PromiseHub.Application.Guardian;

public enum GuardianOutcome
{
    Ok,
    Done,
    /// <summary>Something new was recorded (201), with its id.</summary>
    Created,

    /// <summary>The link is unknown, revoked or long past its deadline (410).</summary>
    Gone,

    /// <summary>The device has not verified a code for this household (401).</summary>
    VerificationRequired,

    /// <summary>Three wrong codes: try again in 15 minutes (423).</summary>
    Locked,

    /// <summary>Too many codes asked for in a short time: wait 15 minutes (429).</summary>
    TooMany,
    NotFound,
    Conflict,
    Invalid,
}
