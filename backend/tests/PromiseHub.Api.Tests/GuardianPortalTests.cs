using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-102 the guardian's child page and the family page's children, L2-104 consents on it, L2-026 links, L2-001 tenant from the link, L2-005 module gates.
public sealed partial class GuardianPortalTests : IAsyncLifetime
{
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_family_page_lists_each_child_with_their_active_programs()
    {
        var (guardian, token) = await Verified();

        var home = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");

        var children = home.GetProperty("children").EnumerateArray().ToList();
        Assert.Equal([Mateo, Sofia], children.Select(c => c.GetProperty("id").GetGuid()));
        Assert.All(children, c => Assert.Equal(["After-School Tutoring"], c.GetProperty("programs").EnumerateArray().Select(p => p.GetString())));
    }

    private async Task<(HttpClient Client, string Token)> Verified(Guid? household = null, Guid? organization = null, string contact = "905-555-0142")
    {
        var token = await Link(household ?? Rivera, organization ?? DatabaseSeeder.Harbourview);
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/g/auth/code", new { token, contact });
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value })).StatusCode);
        return (client, token);
    }

    private async Task<string> Link(Guid household, Guid organization)
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organization);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueHome(household);
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
