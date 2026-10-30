namespace PromiseHub.Application.LearningBond;

/// <summary>What the provider's channel answered: received, with its reference, or not sent.</summary>
public sealed record RespSubmissionResult(bool Sent, string? Reference)
{
    public static RespSubmissionResult NotSent { get; } = new(false, null);
}
