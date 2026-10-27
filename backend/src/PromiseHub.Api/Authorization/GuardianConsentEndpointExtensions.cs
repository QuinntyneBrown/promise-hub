namespace PromiseHub.Api.Authorization;

public static class GuardianConsentEndpointExtensions
{
    /// <summary>Closes youth work to a youth under the consent age until a guardian consents (ADR 0046).</summary>
    public static TBuilder RequireGuardianConsent<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(new GuardianConsentFilter());
}
