namespace PromiseHub.Application.Identity;

/// <summary>New recovery codes, shown once; only their hashes are kept.</summary>
public sealed record RecoveryCodesDto(IReadOnlyList<string> Codes);
