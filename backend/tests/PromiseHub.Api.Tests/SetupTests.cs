using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-008 organization setup wizard, L2-007 roles, L2-001 tenant isolation, L2-032 audit.
public sealed class SetupTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_new_organization_sees_which_steps_are_done_and_what_is_next()
    {
        var setup = await Get(Grace);

        Assert.False(Step(setup, "organization"));
        Assert.True(Step(setup, "program"));
        Assert.True(Step(setup, "children"));
        Assert.False(Step(setup, "slip"));
        Assert.Equal("organization", setup.GetProperty("next").GetString());
        Assert.False(setup.GetProperty("complete").GetBoolean());
    }

    [Fact]
    public async Task Saving_the_organization_step_confirms_the_name_and_moves_on()
    {
        var saved = await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/organization", new { name = "Northgate Kids", city = "Burlington, Ontario" });
        var setup = await Get(Grace);
        var org = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/organization");

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.True(Step(setup, "organization"));
        Assert.NotEqual("organization", setup.GetProperty("next").GetString());
        Assert.Equal("Northgate Kids", org.GetProperty("name").GetString());
    }

    [Fact]
    public async Task An_empty_name_is_refused_and_nothing_is_saved()
    {
        var saved = await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/organization", new { name = " ", city = "Burlington" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, saved.StatusCode);
        Assert.Equal("Enter your organization’s name.", (await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("name").GetString());
        Assert.False(Step(await Get(Grace), "organization"));
    }

    [Fact]
    public async Task Harbourview_has_done_every_step_but_sending_a_slip()
    {
        var setup = await Get(Tom);

        Assert.True(Step(setup, "organization"));
        Assert.True(Step(setup, "staff"));
        Assert.False(Step(setup, "slip"));
    }

    [Fact]
    public async Task Only_settings_managers_see_setup_and_each_organization_has_its_own()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/organization", new { name = "Northgate Kids", city = "Burlington" });

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/setup")).StatusCode);
        Assert.Equal("Harbourview Youth Collective", (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/organization")).GetProperty("name").GetString());
    }

    private async Task<JsonElement> Get(Guid membership) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/setup");

    private static bool Step(JsonElement setup, string key) =>
        setup.GetProperty("steps").EnumerateArray().Single(s => s.GetProperty("key").GetString() == key).GetProperty("done").GetBoolean();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
