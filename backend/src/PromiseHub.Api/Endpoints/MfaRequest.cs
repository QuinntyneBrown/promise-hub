namespace PromiseHub.Api.Endpoints;

public sealed record MfaRequest(string Code, bool TrustDevice);
