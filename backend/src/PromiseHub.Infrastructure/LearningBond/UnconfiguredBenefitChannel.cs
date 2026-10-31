using PromiseHub.Application.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>The benefit channel until a program is integrated: it sends nothing and answers not sent, so nothing leaves a deployment (ADR 0082).</summary>
public sealed class UnconfiguredBenefitChannel : IBenefitChannel
{
    public Task<RespSubmissionResult> SubmitAsync(BenefitSubmission submission, CancellationToken cancellationToken) => Task.FromResult(RespSubmissionResult.NotSent);
}
