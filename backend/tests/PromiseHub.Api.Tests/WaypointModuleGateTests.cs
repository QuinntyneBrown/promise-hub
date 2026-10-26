using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-005 criteria 6 and 7, L2-007 criteria 9, 10 and 12: each Waypoint module's endpoints answer 404 while it is off,
// per organization, and only the roles they serve pass.
public sealed class WaypointModuleGateTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");

    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly string[] Northgate = ["Roster", "RollCall", "QuickCards"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Learning_answers_404_while_off_and_200_once_on_for_that_organization_only()
    {
        await Modules(Grace, [.. Northgate, "Learning"]);
        await Modules(Tom, Suite);
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Sofia, "/learning/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Get(Lucia, "/learning/me")).StatusCode);

        await Modules(Tom, [.. Suite, "Learning"]);
        await Modules(Grace, Northgate);

        var me = await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>("/learning/me");
        Assert.Equal("Sofía Rivera", me.GetProperty("personName").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Lucia, "/learning/me")).StatusCode);
    }

    [Fact]
    public async Task Only_youth_reach_their_learning_record()
    {
        await Modules(Tom, [.. Suite, "Learning"]);

        Assert.Equal(HttpStatusCode.Forbidden, (await Get(Tom, "/learning/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Get(Daniel, "/learning/me")).StatusCode);
    }

    [Fact]
    public async Task Curriculum_follows_Learning_and_only_admins_and_program_directors_author()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Marisol, "/curriculum")).StatusCode);

        await Modules(Tom, [.. Suite, "Learning"]);

        var curriculum = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/curriculum");
        Assert.Empty(curriculum.GetProperty("tracks").EnumerateArray());
        Assert.Equal(HttpStatusCode.OK, (await Get(Tom, "/curriculum")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Get(Jaylen, "/curriculum")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Get(Sofia, "/curriculum")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Grace, "/curriculum")).StatusCode);
    }

    [Fact]
    public async Task Mentoring_lists_only_assigned_youth_none_yet_and_answers_404_while_off()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Daniel, "/mentoring/youth")).StatusCode);

        await Modules(Tom, [.. Suite, "Mentoring"]);

        var youth = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/mentoring/youth");
        Assert.Empty(youth.GetProperty("youth").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Samuel, "/mentoring/youth")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Get(Sofia, "/mentoring/youth")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Get(Marisol, "/mentoring/youth")).StatusCode);
    }

    [Fact]
    public async Task The_public_website_is_anonymous_and_answers_only_for_its_slug_while_the_module_is_on()
    {
        var visitor = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/harbourview")).StatusCode);

        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var site = await visitor.GetFromJsonAsync<JsonElement>("/website/harbourview");
        Assert.Equal("Harbourview Youth Collective", site.GetProperty("name").GetString());
        Assert.Equal("Hamilton, Ontario", site.GetProperty("city").GetString());
        Assert.Equal(2, site.EnumerateObject().Count());
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/northgate")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/nowhere")).StatusCode);
    }

    [Fact]
    public async Task A_suspended_organization_has_no_public_website()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var suspended = await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Harbourview}/suspend", new { reason = "Unpaid" });

        Assert.Equal(HttpStatusCode.NoContent, suspended.StatusCode);
        var response = await _factory.CreateClient().GetAsync("/website/harbourview");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(0, response.Content.Headers.ContentLength ?? 0);
    }

    [Fact]
    public async Task Turning_Learning_off_and_on_again_restores_the_record()
    {
        await Modules(Tom, [.. Suite, "Learning"]);
        var before = await _factory.ClientFor(Sofia).GetStringAsync("/learning/me");

        await Modules(Tom, Suite);
        Assert.Equal(HttpStatusCode.NotFound, (await Get(Sofia, "/learning/me")).StatusCode);
        await Modules(Tom, [.. Suite, "Learning"]);

        Assert.Equal(before, await _factory.ClientFor(Sofia).GetStringAsync("/learning/me"));
    }

    private Task<HttpResponseMessage> Get(Guid membership, string path) => _factory.ClientFor(membership).GetAsync(path);

    private async Task Modules(Guid admin, string[] on) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(admin).PutAsJsonAsync("/settings/modules", new { on })).StatusCode);

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
