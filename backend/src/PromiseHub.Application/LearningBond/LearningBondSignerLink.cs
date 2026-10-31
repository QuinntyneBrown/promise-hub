using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>A resolved signer link: its status, the open request when it is open, and the organization's name when one is known.</summary>
public sealed record LearningBondSignerLink(LearningBondSignerLinkStatus Status, LearningBondSignerRequest? Request, string? Organization);
