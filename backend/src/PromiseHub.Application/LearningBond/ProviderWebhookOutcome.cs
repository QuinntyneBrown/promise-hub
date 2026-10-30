namespace PromiseHub.Application.LearningBond;

/// <summary>What a provider webhook answers: applied (or already applied), unsigned, unknown, or not an event.</summary>
public enum ProviderWebhookOutcome
{
    Applied,
    Unauthorized,
    NotFound,
    Invalid,
}
