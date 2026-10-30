using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.LearningBond;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-161 criteria 3 and 4 (Learning Bond entries are found by searching for Learning Bond, in their own organization only),
// L2-159 criterion 3 (a known SIN is in no log line and no audit entry), L2-162 criterion 1 (Northgate never sees Harbourview's entries).
public sealed class LearningBondAuditTests : IAsyncLifetime
{
    // The sample number the Government of Canada publishes for testing; it belongs to no one.
    private const string Sin = "046 454 286";

    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();
    private readonly CapturingLoggerProvider _logs = new();
    private WebApplicationFactory<Program> _host = null!;

    [Fact]
    public async Task A_destroyed_SIN_is_found_by_searching_for_Learning_Bond_as_System_in_Harbourview_only_and_never_logged()
    {
        await DestroyRiveraSin();

        var harbourview = await Search(Tom, "Learning Bond");
        var northgate = await Search(Grace, "Learning Bond");

        var entry = Assert.Single(harbourview.EnumerateArray());
        Assert.Equal("System", entry.GetProperty("who").GetString());
        Assert.Equal("Deleted", entry.GetProperty("action").GetString());
        Assert.Equal("Learning Bond: guardian SIN destroyed; last three digits kept", entry.GetProperty("summary").GetString());
        Assert.Empty(northgate.EnumerateArray());
        Assert.DoesNotContain(_logs.Lines, l => l.Message.Contains("046454286", StringComparison.Ordinal) || l.Message.Contains(Sin, StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_link_opened_while_the_module_is_off_is_found_by_Northgate_and_never_shown_to_Harbourview()
    {
        var token = await Link(DatabaseSeeder.Northgate, "Rivera");
        await _host.CreateClient().GetAsync($"/g/learning-bond/{token}");

        var northgate = await Search(Grace, "Learning Bond");
        var harbourview = await Search(Tom, "Learning Bond");

        var entry = Assert.Single(northgate.EnumerateArray());
        Assert.Equal("Guardian", entry.GetProperty("who").GetString());
        Assert.Equal("AccessDenied", entry.GetProperty("action").GetString());
        Assert.Empty(harbourview.EnumerateArray());
    }

    private async Task DestroyRiveraSin()
    {
        using var scope = _host.Services.CreateScope();
        var services = scope.ServiceProvider;
        services.GetRequiredService<TenantContext>().ResolveForSystem(DatabaseSeeder.Harbourview);
        var cipher = services.GetRequiredService<ILearningBondCipher>();
        var db = services.GetRequiredService<IPromiseHubDb>();
        var clock = services.GetRequiredService<TimeProvider>();
        var intake = new LearningBondIntake(Guid.NewGuid(), DatabaseSeeder.Harbourview, DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera"), clock.GetUtcNow());
        intake.SetGuardianSin(cipher.Encrypt(Sin), clock.GetUtcNow());
        db.LearningBondIntakes.Add(intake);
        await db.SaveChangesAsync();
        Assert.True(await services.GetRequiredService<LearningBondSinDestroyer>().DestroyGuardianSinAsync(intake.Id));
    }

    private async Task<string> Link(Guid organizationId, string household)
    {
        using var scope = _host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueHome(DatabaseSeeder.HouseholdId(organizationId, household));
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private async Task<JsonElement> Search(Guid who, string q)
    {
        var client = _host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName, who.ToString());
        return (await client.GetFromJsonAsync<JsonElement>($"/audit?q={Uri.EscapeDataString(q)}")).GetProperty("entries");
    }

    public Task InitializeAsync()
    {
        _host = _factory.WithWebHostBuilder(b => b.ConfigureLogging(l => l.AddProvider(_logs)));
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        await _host.DisposeAsync();
        await _factory.DisposeAsync();
    }
}
