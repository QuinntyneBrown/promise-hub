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
    /// <summary>The request names something that isn't this household guardian's to decide (403).</summary>
    Forbidden,
    NotFound,
    /// <summary>A service the request needs isn't available, such as the Learning Bond key (503); nothing is stored.</summary>
    Unavailable,
    Conflict,
    Invalid,
}
