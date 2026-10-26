namespace PromiseHub.Application.Organizations;

/// <summary>Privacy and data (`settings-privacy`): the fixed region and the consent retention, null meaning until deleted by request.</summary>
public sealed record PrivacySettingsDto(string Region, int? ConsentRetentionYears);
