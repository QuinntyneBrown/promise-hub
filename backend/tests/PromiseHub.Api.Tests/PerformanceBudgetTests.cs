using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Observability;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-033 criteria 2 and 4, on the CI runner: server time read from the same request metrics the alerts use (L2-041).
public sealed class PerformanceBudgetTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid TonightId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly string[] Roster = ["Jordan Thompson", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_check_in_is_confirmed_by_the_server_within_one_second_at_the_95th_percentile()
    {
        var checkIns = Roster.Select(name => Client(Jaylen).PostAsJsonAsync($"/sessions/{TonightId}/check-ins",
            new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, name), arrivedAt = (string?)null, clientActionId = Guid.NewGuid() }));

        var answers = await Task.WhenAll(checkIns);

        Assert.All(answers, a => Assert.Equal(HttpStatusCode.OK, a.StatusCode));
        Assert.True(Metrics.Summary(DatabaseSeeder.Harbourview).P95Ms < 1000);
    }

    [Fact]
    public async Task Two_organizations_running_sessions_at_once_keep_the_95th_percentile_under_500_ms()
    {
        await Client(Jaylen).GetAsync("/sessions/today");
        var requests = Enumerable.Range(0, 50).SelectMany(_ => new[]
        {
            Client(Jaylen).GetAsync("/sessions/today"),
            Client(Jaylen).GetAsync($"/sessions/{TonightId}/roster"),
            Client(Grace).GetAsync("/sessions/today"),
        });

        var answers = await Task.WhenAll(requests);

        Assert.All(answers, a => Assert.Equal(HttpStatusCode.OK, a.StatusCode));
        var (count, errors, p95) = Metrics.Summary();
        Assert.Equal(151, count);
        Assert.Equal(0, errors);
        Assert.True(p95 < 500, $"p95 was {p95} ms");
    }

    private RequestMetrics Metrics => _factory.Services.GetRequiredService<RequestMetrics>();

    private HttpClient Client(Guid membership)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Test", membership.ToString());
        return client;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
