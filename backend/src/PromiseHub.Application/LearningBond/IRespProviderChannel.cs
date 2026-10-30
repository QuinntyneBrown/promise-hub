namespace PromiseHub.Application.LearningBond;

/// <summary>Sends an application to an RESP provider's submission channel (L2-149). Only Submit calls it; the agent has no tool that does.</summary>
public interface IRespProviderChannel
{
    Task<RespSubmissionResult> SubmitAsync(RespSubmission submission, CancellationToken cancellationToken);
}
