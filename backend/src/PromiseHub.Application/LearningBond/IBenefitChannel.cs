namespace PromiseHub.Application.LearningBond;

/// <summary>Sends one benefit application to its program's electronic channel (L2-156 criterion 3). Only the guardian's Submit calls it.</summary>
public interface IBenefitChannel
{
    Task<RespSubmissionResult> SubmitAsync(BenefitSubmission submission, CancellationToken cancellationToken);
}
