namespace PromiseHub.Application.Guardian;

/// <summary>Where guardian links point: the web app's address, from configuration (<c>Guardian:LinkBaseUrl</c>).</summary>
public sealed record GuardianLinkOptions(string BaseUrl);
