using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-002 active organization and switching, L2-001 tenant isolation, L2-032 audit.
public sealed class SwitchOrganizationTests : IAsyncLifetime
{
    private static readonly Guid PriyaAtNorthgate = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "priya@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task A_person_in_two_organizations_sees_both_with_the_active_one_marked()
    {
        var browser = await SignIn("priya@harbourview.example");

        var list = await browser.GetFromJsonAsync<JsonElement>("/me/organizations");

        var orgs = list.GetProperty("organizations").EnumerateArray().ToList();
        Assert.Equal(["Harbourview Youth Collective", "Northgate Community Church Kids"], orgs.Select(o => o.GetProperty("name").GetString()!).ToArray());
        Assert.True(orgs[0].GetProperty("active").GetBoolean());
        Assert.Equal("VolunteerCoordinator", orgs[1].GetProperty("role").GetString());
    }

    [Fact]
    public async Task Switching_changes_the_organization_of_every_later_request_and_is_audited()
    {
        var browser = await SignIn("priya@harbourview.example");

        var switched = await browser.PostAsJsonAsync("/me/organization", new { membershipId = PriyaAtNorthgate });
        var me = await browser.GetFromJsonAsync<JsonElement>("/me");
        var families = await browser.GetFromJsonAsync<JsonElement>("/households");

        Assert.Equal(HttpStatusCode.NoContent, switched.StatusCode);
        Assert.Equal("Northgate Community Church Kids", me.GetProperty("organizationName").GetString());
        Assert.Equal(["Rivera"], families.GetProperty("households").EnumerateArray().Select(h => h.GetProperty("name").GetString()!).ToArray());
        Assert.NotEmpty(Query($"SELECT Id FROM AuditEntries WHERE Action = 'Switched' AND OrganizationId = '{DatabaseSeeder.Northgate.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task Someone_cannot_switch_into_a_membership_that_is_not_theirs()
    {
        var browser = await SignIn("priya@harbourview.example");

        var switched = await browser.PostAsJsonAsync("/me/organization", new { membershipId = Grace });

        Assert.Equal(HttpStatusCode.NotFound, switched.StatusCode);
        Assert.Equal("Harbourview Youth Collective", (await browser.GetFromJsonAsync<JsonElement>("/me")).GetProperty("organizationName").GetString());
    }

    [Fact]
    public async Task A_membership_removed_while_active_moves_the_person_to_their_remaining_organization()
    {
        var browser = await SignIn("priya@harbourview.example");

        Execute($"UPDATE Memberships SET RemovedAt = 1 WHERE Id = '{PriyaAtHarbourview.ToString().ToUpperInvariant()}'");
        var me = await browser.GetFromJsonAsync<JsonElement>("/me");

        Assert.Equal("Northgate Community Church Kids", me.GetProperty("organizationName").GetString());
    }

    [Fact]
    public async Task A_person_with_one_organization_lists_just_it()
    {
        var browser = await SignIn("aisha@harbourview.example");

        var list = await browser.GetFromJsonAsync<JsonElement>("/me/organizations");

        Assert.Single(list.GetProperty("organizations").EnumerateArray());
    }

    private async Task<HttpClient> SignIn(string email)
    {
        var browser = _factory.NewBrowser();
        (await browser.PostAsJsonAsync("/auth/sign-in", new { email, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        return browser;
    }

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
            rows.Add(reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
