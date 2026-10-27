using PromiseHub.Domain.Guardian;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// Whether a child needs a guardian's consent and what is on record (ADR 0046): required when the child has an active youth
/// account and is under the consent age (or has no date of birth); <see cref="Latest"/> is the child's latest consent.
/// </summary>
public sealed record ConsentStatus(bool Required, int ConsentAge, GuardianConsent? Latest)
{
    public bool InForce => Latest is { InForce: true };

    /// <summary>Needed, Given or Withdrawn.</summary>
    public string Name => Latest is null ? "Needed" : Latest.InForce ? "Given" : "Withdrawn";

    /// <summary>True when the youth may not use protected Learning endpoints (L2-056, L2-057).</summary>
    public bool Gated => Required && !InForce;
}
