using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-039 global search, L2-007 criterion 7 permitted records, L2-005 modules off, L2-001 tenant isolation.
public sealed class SearchTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_name_fragment_finds_children_families_and_events_grouped_by_type()
    {
        var riv = await Search(Jaylen, "riv");
        var trip = await Search(Jaylen, "botanical");

        Assert.Equal(["Mateo Rivera", "Sofía Rivera"], Names(riv, "children"));
        Assert.Equal(["Rivera"], Names(riv, "households"));
        Assert.Equal(["Fall field trip: Royal Botanical Gardens"], Names(trip, "events"));
    }

    [Fact]
    public async Task A_phone_fragment_finds_the_family_whatever_the_punctuation()
    {
        var result = await Search(Jaylen, "5550163");

        Assert.Equal(["Tran"], Names(result, "households"));
    }

    [Fact]
    public async Task A_youth_worker_finds_only_the_children_and_families_of_her_sessions()
    {
        var result = await Search(Aisha, "tran");

        Assert.Empty(Names(result, "children"));
        Assert.Empty(Names(result, "households"));
    }

    [Fact]
    public async Task With_Slips_off_events_are_not_returned()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        var result = await Search(Jaylen, "botanical");

        Assert.Equal(JsonValueKind.Null, result.GetProperty("events").ValueKind);
    }

    [Fact]
    public async Task Another_organization_finds_only_its_own_records()
    {
        var result = await Search(Grace, "rivera");

        Assert.Equal(["Rivera"], Names(result, "households"));
        Assert.Equal("Ana Rivera", result.GetProperty("households")[0].GetProperty("guardians").GetString());
    }

    [Fact]
    public async Task An_empty_query_returns_nothing_and_Roster_off_answers_404()
    {
        var empty = await Search(Jaylen, " ");
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Empty(Names(empty, "children"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync("/search?q=riv")).StatusCode);
    }

    private async Task<JsonElement> Search(Guid membership, string q) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>($"/search?q={Uri.EscapeDataString(q)}");

    private static string[] Names(JsonElement result, string group) =>
        result.GetProperty(group).ValueKind == JsonValueKind.Null ? [] : [.. result.GetProperty(group).EnumerateArray().Select(e => e.GetProperty("name").GetString()!)];

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
