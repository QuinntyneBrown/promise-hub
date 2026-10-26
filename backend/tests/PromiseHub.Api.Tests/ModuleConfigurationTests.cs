using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-004 module configuration per organization, L2-005 modules that are off are unreachable.
public sealed class ModuleConfigurationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid HarbourviewMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    // The eight operations modules Harbourview's seed turns on; the Waypoint modules follow in the catalog (ADR 0043).
    private static readonly string[] All = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly string[] Catalog = [.. All, "Learning", "Mentoring", "PublicWebsite"];
    private static readonly string[] Seeded = [.. All, "Learning", "Mentoring"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_sees_every_module_with_its_dependencies()
    {
        var modules = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/modules");

        var rows = modules.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(Catalog, rows.Select(m => m.GetProperty("id").GetString()));
        Assert.All(rows.Where(m => All.Contains(m.GetProperty("id").GetString())), m => Assert.True(m.GetProperty("on").GetBoolean()));
        var pickup = rows.Single(m => m.GetProperty("id").GetString() == "Pickup");
        Assert.Equal(["Roster", "RollCall"], pickup.GetProperty("needs").EnumerateArray().Select(n => n.GetString()));
    }

    [Fact]
    public async Task Turning_everything_off_but_Roll_Call_keeps_Roster_and_Roll_Call()
    {
        var response = await Save(Tom, "Roster", "RollCall");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(2, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("on").GetInt32());
        Assert.Equal(["Roster", "RollCall"], await ModulesOn(Tom));
    }

    [Fact]
    public async Task Pickup_without_Roll_Call_is_rejected_naming_the_missing_dependency()
    {
        var response = await Save(Tom, "Roster", "Pickup");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray().ToList();
        var error = Assert.Single(errors);
        Assert.Equal("Pickup", error.GetProperty("module").GetString());
        Assert.Equal("Pickup needs Roll Call.", error.GetProperty("message").GetString());
        Assert.Equal(Seeded, await ModulesOn(Tom));
    }

    [Fact]
    public async Task Turning_Roster_off_while_other_modules_are_on_names_every_module_that_needs_it()
    {
        var response = await Save(Tom, "Slips", "RollCall", "Pickup");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var error = Assert.Single((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray());
        Assert.Equal("Roster", error.GetProperty("module").GetString());
        Assert.Equal("Permission slips, Roll Call and Pickup need the roster.", error.GetProperty("message").GetString());
    }

    [Fact]
    public async Task A_site_lead_cannot_read_or_change_modules()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/modules")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Jaylen, "Roster")).StatusCode);
    }

    [Fact]
    public async Task One_organizations_change_never_touches_another()
    {
        var response = await Save(Grace, "Roster");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["Roster"], await ModulesOn(Grace));
        Assert.Equal(Seeded, await ModulesOn(Tom));
    }

    [Fact]
    public async Task The_second_organization_starts_with_its_own_subset()
    {
        Assert.Equal(["Roster", "RollCall", "QuickCards"], await ModulesOn(Grace));
    }

    [Fact]
    public async Task The_session_lists_the_modules_that_are_on()
    {
        var session = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/me");

        Assert.Equal(["Roster", "RollCall", "QuickCards"], session.GetProperty("modules").EnumerateArray().Select(m => m.GetString()));
    }

    [Fact]
    public async Task A_module_change_is_audited_with_before_and_after()
    {
        await Save(Tom, "Roster", "RollCall");

        var rows = Query("SELECT ActorName, BeforeJson, AfterJson FROM AuditEntries WHERE Action = 'ModuleChanged'");
        var row = Assert.Single(rows);
        Assert.StartsWith("Tom Nguyen|", row);
        Assert.Contains("Reports", row.Split('|')[1]);
        Assert.DoesNotContain("Reports", row.Split('|')[2]);
    }

    [Fact]
    public async Task An_endpoint_of_a_module_that_is_off_answers_404_and_its_data_returns_when_turned_back_on()
    {
        var client = _factory.ClientFor(Tom);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/children/{HarbourviewMateo}")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await Save(Tom)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/children/{HarbourviewMateo}")).StatusCode);

        await Save(Tom, All);
        var child = await client.GetFromJsonAsync<JsonElement>($"/children/{HarbourviewMateo}");
        Assert.Equal("Mateo Rivera", child.GetProperty("name").GetString());
    }

    // L2-004 criterion 6.
    [Fact]
    public async Task Learning_Mentoring_and_Public_website_follow_Reports_each_needing_the_roster_and_are_off_for_an_organization_that_never_turned_them_on()
    {
        var modules = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/modules");

        var rows = modules.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(Catalog, rows.Select(m => m.GetProperty("id").GetString()));
        foreach (var (id, name) in new[] { ("Learning", "Learning"), ("Mentoring", "Mentoring"), ("PublicWebsite", "Public website") })
        {
            var row = rows.Single(m => m.GetProperty("id").GetString() == id);
            Assert.Equal(name, row.GetProperty("name").GetString());
            Assert.False(row.GetProperty("on").GetBoolean());
            Assert.Equal(["Roster"], row.GetProperty("needs").EnumerateArray().Select(n => n.GetString()));
        }
    }

    // L2-004 criterion 7.
    [Fact]
    public async Task Turning_Roster_off_while_Learning_and_Mentoring_are_on_is_rejected_and_nothing_changes()
    {
        Assert.Equal(HttpStatusCode.OK, (await Save(Grace, "Roster", "Learning", "Mentoring")).StatusCode);

        var response = await Save(Grace, "Learning", "Mentoring");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var error = Assert.Single((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray());
        Assert.Equal("Roster", error.GetProperty("module").GetString());
        Assert.Equal("Learning and Mentoring need the roster.", error.GetProperty("message").GetString());
        Assert.Equal(["Roster", "Learning", "Mentoring"], await ModulesOn(Grace));
    }

    // L2-004 criterion 8: one organization's Waypoint modules never touch another's.
    [Fact]
    public async Task Turning_the_Waypoint_modules_on_for_one_organization_leaves_the_other_unchanged()
    {
        var response = await Save(Grace, "Roster", "RollCall", "QuickCards", "Learning", "Mentoring", "PublicWebsite");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["Roster", "RollCall", "QuickCards", "Learning", "Mentoring", "PublicWebsite"], await ModulesOn(Grace));
        Assert.DoesNotContain("PublicWebsite", await ModulesOn(Tom));
    }

    private Task<HttpResponseMessage> Save(Guid membership, params string[] on) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/modules", new { on });

    private async Task<string[]> ModulesOn(Guid membership)
    {
        var modules = await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/me");
        return [.. modules.GetProperty("modules").EnumerateArray().Select(m => m.GetString()!)];
    }

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
