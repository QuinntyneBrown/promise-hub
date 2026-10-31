namespace PromiseHub.Application.LearningBond;

/// <summary>GET /learning-bond/invitation (L2-139): the sender name and the invitation in each language the households use.</summary>
public sealed record LearningBondInvitationDto(string SenderName, IReadOnlyList<LearningBondInvitationLanguageDto> Languages);
