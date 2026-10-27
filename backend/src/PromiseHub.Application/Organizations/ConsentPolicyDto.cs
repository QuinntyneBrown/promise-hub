namespace PromiseHub.Application.Organizations;

/// <summary>The consent policy on Privacy and data (`settings-privacy`, L2-056).</summary>
public sealed record ConsentPolicyDto(int ConsentAge, string Wording);
