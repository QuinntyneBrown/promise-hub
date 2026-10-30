using System.Collections.Concurrent;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Tests;

/// <summary>Records every application sent to a provider, so tests prove nothing leaves before Submit and nothing leaves twice; it can fail.</summary>
public sealed class FakeRespProviderChannel : IRespProviderChannel
{
    private readonly ConcurrentQueue<RespSubmission> _submissions = new();

    public IReadOnlyList<RespSubmission> Submissions => [.. _submissions];

    /// <summary>When true, the provider refuses and nothing is recorded as sent.</summary>
    public bool Fail { get; set; }

    public Task<RespSubmissionResult> SubmitAsync(RespSubmission submission, CancellationToken cancellationToken)
    {
        if (Fail)
        {
            return Task.FromResult(RespSubmissionResult.NotSent);
        }
        _submissions.Enqueue(submission);
        return Task.FromResult(new RespSubmissionResult(true, $"NCU-{_submissions.Count:D4}"));
    }
}
