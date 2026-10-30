using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-003 platform administration of organizations, L2-001 tenant isolation, L2-032 audit.
public sealed class PlatformOrganizationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_platform_admin_lists_every_organization_with_plan_children_modules_and_status()
    {
        var list = await Get("/platform/organizations");

        var orgs = list.GetProperty("organizations").EnumerateArray().ToList();
        var harbourview = orgs.Single(o => o.GetProperty("name").GetString() == "Harbourview Youth Collective");
        var northgate = orgs.Single(o => o.GetProperty("name").GetString() == "Northgate Community Church Kids");
        Assert.Equal("Standard", harbourview.GetProperty("plan").GetString());
        // Seven children plus Nadia Haddad, whose youth account the seed links (ADR 0043).
        Assert.Equal(8, harbourview.GetProperty("activeChildren").GetInt32());
        // The whole suite, Learning, Mentoring and Learning Bond (ADR 0076).
        Assert.Equal(11, harbourview.GetProperty("modulesOn").GetInt32());
        Assert.Equal("Active", harbourview.GetProperty("status").GetString());
        Assert.Equal("SettingUp", northgate.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Search_and_status_narrow_the_list()
    {
        var byName = await Get("/platform/organizations?q=north");
        var setting = await Get("/platform/organizations?status=SettingUp");

        Assert.Equal(["Northgate Community Church Kids"], Names(byName));
        Assert.Equal(["Northgate Community Church Kids"], Names(setting));
    }

    [Fact]
    public async Task Adding_an_organization_creates_the_tenant_invites_its_admin_and_shows_it_setting_up()
    {
        var added = await _factory.ClientFor(Tom).PostAsJsonAsync("/platform/organizations", new { name = "Kitchener Youth Alliance", adminEmail = "dana@kitcheneryouth.example", plan = "Free", preset = "Just check-in" });

        Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        var row = (await Get("/platform/organizations?q=kitchener")).GetProperty("organizations")[0];
        Assert.Equal("SettingUp", row.GetProperty("status").GetString());
        Assert.Equal(3, row.GetProperty("modulesOn").GetInt32());
        Assert.Contains(Email.Sent, e => e.To == "dana@kitcheneryouth.example");
    }

    [Fact]
    public async Task Adding_needs_a_name_and_an_admin_email()
    {
        var added = await _factory.ClientFor(Tom).PostAsJsonAsync("/platform/organizations", new { name = "", adminEmail = "dana", plan = "Free", preset = "Whole suite" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, added.StatusCode);
        var errors = (await added.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the organization’s name.", errors.GetProperty("name").GetString());
        Assert.Equal("That doesn’t look like an email address.", errors.GetProperty("adminEmail").GetString());
    }

    [Fact]
    public async Task Suspending_blocks_staff_and_outbound_messages_deletes_nothing_and_reinstating_restores()
    {
        var suspended = await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Northgate}/suspend", new { reason = "Unpaid since September" });
        var blocked = await _factory.ClientFor(Grace).GetAsync("/households");

        Assert.Equal(HttpStatusCode.NoContent, suspended.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);
        Assert.Equal("suspended", (await blocked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal("Suspended", (await Get("/platform/organizations?q=north")).GetProperty("organizations")[0].GetProperty("status").GetString());
        Assert.NotEmpty(Query($"SELECT Id FROM Households WHERE OrganizationId = '{DatabaseSeeder.Northgate.ToString().ToUpperInvariant()}'"));

        await _factory.ClientFor(Tom).PostAsync($"/platform/organizations/{DatabaseSeeder.Northgate}/reinstate", null);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Grace).GetAsync("/households")).StatusCode);
    }

    [Fact]
    public async Task A_suspended_organizations_queued_messages_are_not_sent()
    {
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Harbourview}/suspend", new { reason = "Testing" });
        var queuedBefore = Query("SELECT COUNT(*) FROM Deliveries").Single();
        Execute($"UPDATE Organizations SET SuspendedAt = NULL WHERE Id = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'");
        await _factory.ClientFor(Tom).PostAsJsonAsync("/messages", new { subject = "Tonight", body = "Tutoring is on.", channel = "TextOnly", audience = new { programId = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring") } });
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Harbourview}/suspend", new { reason = "Testing" });

        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

        Assert.Empty(Sms.Sent);
        Assert.NotNull(queuedBefore);
    }

    [Fact]
    public async Task Only_platform_admins_open_the_list()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync("/platform/organizations")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Harbourview}/suspend", new { reason = "x" })).StatusCode);
    }

    private async Task<JsonElement> Get(string path) => await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>(path);

    private static string[] Names(JsonElement list) => [.. list.GetProperty("organizations").EnumerateArray().Select(o => o.GetProperty("name").GetString()!)];

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
