namespace PromiseHub.Application.Learning;

/// <summary>
/// The work a youth sends (L2-077 criterion 3): a reflection, a link and a file as the assignment accepts them, the attestation, and when
/// resubmitting whether to drop the earlier file.
/// </summary>
public sealed record SubmissionWork(string? Text, string? Link, bool Attest, SubmissionUpload? File, bool RemoveFile = false);
