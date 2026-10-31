using PromiseHub.Application.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>
/// The channel until a provider's integration is configured: it sends nothing and answers not sent, so the application stays ready to submit
/// and the guardian is told nothing went (L2-149 criterion 5).
/// </summary>
public sealed class UnconfiguredRespProviderChannel : IRespProviderChannel
{
    public Task<RespSubmissionResult> SubmitAsync(RespSubmission submission, CancellationToken cancellationToken) => Task.FromResult(RespSubmissionResult.NotSent);

    public Task<RespSubmissionResult> SendDocumentAsync(RespDocument document, CancellationToken cancellationToken) => Task.FromResult(RespSubmissionResult.NotSent);
}
