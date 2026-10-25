using System.Net.Http.Headers;

namespace PromiseHub.Api.Tests;

/// <summary>The API with test authentication: <see cref="ClientFor"/> signs a client in to a membership.</summary>
public sealed class PromiseHubApiFactory : ApiFactoryBase
{
    public PromiseHubApiFactory()
        : base(migrateAndSeed: true, testAuth: true)
    {
    }

    internal PromiseHubApiFactory(bool migrateAndSeed)
        : base(migrateAndSeed, testAuth: true)
    {
    }

    public HttpClient ClientFor(Guid membershipId)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName, membershipId.ToString());
        return client;
    }
}
