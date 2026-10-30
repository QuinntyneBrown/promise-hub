using System.Collections.Concurrent;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Tests;

/// <summary>Records every benefit application sent, so tests prove each is sent once, on its own, and nothing before Submit.</summary>
public sealed class FakeBenefitChannel : IBenefitChannel
{
    private readonly ConcurrentQueue<BenefitSubmission> _submissions = new();

    public IReadOnlyList<BenefitSubmission> Submissions => [.. _submissions];

    public bool Fail { get; set; }

    public Task<RespSubmissionResult> SubmitAsync(BenefitSubmission submission, CancellationToken cancellationToken)
    {
        if (Fail)
        {
            return Task.FromResult(RespSubmissionResult.NotSent);
        }
        _submissions.Enqueue(submission);
        return Task.FromResult(new RespSubmissionResult(true, $"BEN-{_submissions.Count:D4}"));
    }
}
