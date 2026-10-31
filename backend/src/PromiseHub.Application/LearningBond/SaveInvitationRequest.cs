namespace PromiseHub.Application.LearningBond;

/// <summary>PUT /learning-bond/invitation: the sender name, the only part of the invitation an organization edits (L2-139 criterion 2).</summary>
public sealed record SaveInvitationRequest(string? SenderName);
