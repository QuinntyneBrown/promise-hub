using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-007 role-based authorization on the server, L2-001 tenant isolation, L2-031 security headers.
public sealed class AuthorizationTests(PromiseHubApiFactory factory) : IClassFixture<PromiseHubApiFactory>
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    [Fact]
    public async Task A_site_lead_calling_a_settings_endpoint_gets_403()
    {
        var answer = await factory.ClientFor(Jaylen).GetAsync("/settings/organization");

        Assert.Equal(HttpStatusCode.Forbidden, answer.StatusCode);
    }

    [Fact]
    public async Task An_admin_reads_their_organizations_settings()
    {
        var settings = await factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/organization");

        Assert.Equal("Harbourview Youth Collective", settings.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Another_organizations_admin_reads_only_their_own_settings()
    {
        var settings = await factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>($"/settings/organization?organizationId={DatabaseSeeder.Harbourview}");

        Assert.Equal("Northgate Community Church Kids", settings.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Responses_carry_the_security_headers()
    {
        var answer = await factory.CreateClient().GetAsync("/health/ready");

        Assert.Equal("nosniff", answer.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Contains("frame-ancestors 'none'", answer.Headers.GetValues("Content-Security-Policy").Single());
        Assert.Equal("no-referrer", answer.Headers.GetValues("Referrer-Policy").Single());
    }
}
