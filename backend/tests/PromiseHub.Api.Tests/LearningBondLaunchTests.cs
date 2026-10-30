using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-140 launching invitations: the covered households and how each can be reached, the missing contacts, the no-phone block;
// admins only, behind the module gate, per organization (L2-162).
public sealed class LearningBondLaunchTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-140 criterion 1: Rivera and Haddad have a mobile, Tran only an email, Thompson neither.
    [Fact]
    public async Task Launch_counts_the_covered_households_by_how_each_can_be_reached_and_lists_those_with_neither()
    {
        Execute("UPDATE Guardians SET Mobile = NULL, Email = 'linh.tran@example.com' WHERE Name = 'Linh Tran'");
        Execute("UPDATE Guardians SET Mobile = NULL, Email = NULL WHERE Name = 'Dana Thompson'");
        var tom = _factory.ClientFor(Tom);

        var launch = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch");

        Assert.Equal(4, launch.GetProperty("covered").GetInt32());
        Assert.Equal(2, launch.GetProperty("mobile").GetInt32());
        Assert.Equal(1, launch.GetProperty("emailOnly").GetInt32());
        Assert.Equal(1, launch.GetProperty("neither").GetInt32());
        Assert.False(launch.GetProperty("noPhoneNumbers").GetBoolean());
        Assert.Equal(JsonValueKind.Null, launch.GetProperty("mode").ValueKind);
        Assert.Equal(JsonValueKind.Null, launch.GetProperty("date").ValueKind);
        Assert.Equal(new DateOnly(2026, 11, 6), DateOnly.Parse(launch.GetProperty("earliest").GetString()!, System.Globalization.CultureInfo.InvariantCulture));
        Assert.Equal(new DateOnly(2027, 2, 3), DateOnly.Parse(launch.GetProperty("latest").GetString()!, System.Globalization.CultureInfo.InvariantCulture));

        var missing = (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch/missing-contacts")).GetProperty("households");
        var thompson = Assert.Single(missing.EnumerateArray());
        Assert.Equal("Thompson", thompson.GetProperty("name").GetString());
        Assert.Equal("Dana Thompson", thompson.GetProperty("guardian").GetString());
        Assert.Equal("After-School Tutoring", thompson.GetProperty("programs").GetString());
        Assert.False(thompson.TryGetProperty("mobile", out _));
    }

    // L2-140 criterion 2: no covered household has a guardian with a mobile number.
    [Fact]
    public async Task With_no_mobile_number_on_any_covered_household_the_launch_says_so()
    {
        Execute("UPDATE Guardians SET Mobile = NULL");

        var launch = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/launch");

        Assert.True(launch.GetProperty("noPhoneNumbers").GetBoolean());
        Assert.Equal(0, launch.GetProperty("mobile").GetInt32());
    }

    // L2-140 criteria 8 and 9, L2-162: a site lead may not launch; while Learning Bond is off the launch is unknown; each organization
    // counts only its own households.
    [Fact]
    public async Task A_site_lead_gets_403_the_module_off_answers_404_and_Northgate_counts_only_its_own()
    {
        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/launch")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/launch/missing-contacts")).StatusCode);

        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/launch")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await grace.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "LearningBond" } })).StatusCode);

        var launch = await grace.GetFromJsonAsync<JsonElement>("/learning-bond/launch");
        Assert.Equal(1, launch.GetProperty("covered").GetInt32());
        Assert.Equal(1, launch.GetProperty("mobile").GetInt32());
        Assert.Empty((await grace.GetFromJsonAsync<JsonElement>("/learning-bond/launch/missing-contacts")).GetProperty("households").EnumerateArray());
    }

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
