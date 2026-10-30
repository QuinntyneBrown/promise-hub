using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-144 criterion 7: the guardian home carries a Learning Bond card once the household is invited, with where each covered child stands;
// nothing mentions it before the invitation, after I'm not interested, or with the module off (L2-162).
public sealed class LearningBondGuardianHomeTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_invited_household_sees_each_covered_child_and_where_their_claim_stands()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });

        var home = await carmen.Http.GetFromJsonAsync<JsonElement>($"/g/home/{carmen.Token}");

        var card = home.GetProperty("learningBond");
        Assert.Equal(
            ["Mateo|Started", "Sofía|Invited"],
            card.GetProperty("children").EnumerateArray().Select(c => $"{c.GetProperty("firstName").GetString()}|{c.GetProperty("status").GetString()}"));
    }

    [Fact]
    public async Task Not_interested_hides_the_card()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/choice"), new { choice = "NotInterested" });

        var home = await carmen.Http.GetFromJsonAsync<JsonElement>($"/g/home/{carmen.Token}");

        Assert.Equal(JsonValueKind.Null, home.GetProperty("learningBond").ValueKind);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
