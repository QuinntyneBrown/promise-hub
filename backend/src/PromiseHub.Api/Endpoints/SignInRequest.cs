namespace PromiseHub.Api.Endpoints;

public sealed record SignInRequest(string Email, string Password, bool Remember);
