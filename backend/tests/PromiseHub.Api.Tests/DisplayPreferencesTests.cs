using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-119 criteria 1, 4 to 6, L2-120 criteria 3 and 4
// Description: each person's theme, text size and reduce motion are kept with them, carried by the session, follow them to every
// organization, accept only the known values and are never another person's.
public sealed class DisplayPreferencesTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid PriyaAtNorthgate = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "priya@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Everyone_starts_on_the_system_theme_default_text_and_motion()
    {
        var display = await Get(Jaylen);

        Assert.Equal("system", display.GetProperty("theme").GetString());
        Assert.Equal("default", display.GetProperty("textSize").GetString());
        Assert.False(display.GetProperty("reduceMotion").GetBoolean());
    }

    [Fact]
    public async Task A_saved_choice_is_returned_and_carried_by_the_session()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await Save(Sofia, "dark", "large", true)).StatusCode);

        var display = await Get(Sofia);
        Assert.Equal("dark", display.GetProperty("theme").GetString());
        Assert.Equal("large", display.GetProperty("textSize").GetString());
        Assert.True(display.GetProperty("reduceMotion").GetBoolean());
        var session = (await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>("/me")).GetProperty("display");
        Assert.Equal("dark", session.GetProperty("theme").GetString());
        Assert.Equal("large", session.GetProperty("textSize").GetString());
        Assert.True(session.GetProperty("reduceMotion").GetBoolean());
    }

    [Fact]
    public async Task An_unknown_theme_or_text_size_is_refused_and_nothing_is_stored()
    {
        var refused = await Save(Jaylen, "neon", "huge", false);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        var errors = (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Choose System, Light or Dark.", errors.GetProperty("theme").GetString());
        Assert.Equal("Choose Default, Large or Larger.", errors.GetProperty("textSize").GetString());
        Assert.Equal("system", (await Get(Jaylen)).GetProperty("theme").GetString());
    }

    [Fact]
    public async Task The_choice_follows_the_person_to_another_organization_and_is_never_someone_elses()
    {
        await Save(PriyaAtHarbourview, "light", "larger", false);

        var northgate = await Get(PriyaAtNorthgate);
        Assert.Equal("light", northgate.GetProperty("theme").GetString());
        Assert.Equal("larger", northgate.GetProperty("textSize").GetString());
        var grace = await Get(Grace);
        Assert.Equal("system", grace.GetProperty("theme").GetString());
        Assert.Equal("default", grace.GetProperty("textSize").GetString());
        Assert.Equal("system", (await Get(Jaylen)).GetProperty("theme").GetString());
    }

    [Fact]
    public async Task Without_a_session_both_answer_401()
    {
        var anonymous = _factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/me/display")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonymous.PutAsJsonAsync("/me/display", new { theme = "dark", textSize = "default", reduceMotion = false })).StatusCode);
    }

    private Task<HttpResponseMessage> Save(Guid who, string theme, string textSize, bool reduceMotion) =>
        _factory.ClientFor(who).PutAsJsonAsync("/me/display", new { theme, textSize, reduceMotion });

    private async Task<JsonElement> Get(Guid who) => await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/me/display");

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
