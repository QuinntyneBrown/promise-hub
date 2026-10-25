using Microsoft.AspNetCore.Mvc.Testing;

namespace PromiseHub.Api.Tests;

/// <summary>The API with its real cookie sign-in, reached over HTTPS so secure cookies round-trip.</summary>
public sealed class SignInApiFactory : ApiFactoryBase
{
    public SignInApiFactory()
        : base(migrateAndSeed: true, testAuth: false)
    {
    }

    public HttpClient NewBrowser() =>
        CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
}
