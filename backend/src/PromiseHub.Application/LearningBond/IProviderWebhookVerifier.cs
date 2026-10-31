namespace PromiseHub.Application.LearningBond;

/// <summary>Checks that a webhook body was signed by the provider whose channel it names (L2-150 criterion 3).</summary>
public interface IProviderWebhookVerifier
{
    bool Verify(string channel, string body, string? signature);
}
