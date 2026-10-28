using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-113 criteria 2 and 3, L2-114, L2-007, L2-032
// Description: an admin changes a participant's role from the record; a youth account's role follows its child record, nobody
// becomes Youth, Mentor needs Mentoring on, and every change is audited with before and after.
public sealed class PersonRoleChangeTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly string[] AllOn = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning", "Mentoring"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_volunteer_made_a_youth_worker_gets_the_role_on_the_next_request_and_it_is_audited_with_before_and_after()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Leo).GetAsync("/households")).StatusCode);

        var changed = await Change(Leo, "YouthWorker");

        Assert.Equal(HttpStatusCode.NoContent, changed.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Leo).GetAsync("/households")).StatusCode);
        Assert.Equal("YouthWorker", (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/people/{Leo}")).GetProperty("role").GetString());
        var audit = Query("SELECT BeforeJson || ' ' || AfterJson FROM AuditEntries WHERE Action = 'RoleChanged'").Single();
        Assert.Contains("Volunteer", audit, StringComparison.Ordinal);
        Assert.Contains("YouthWorker", audit, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_youth_accounts_role_is_fixed_and_nobody_becomes_youth()
    {
        Assert.Equal("A youth account’s role follows its child record.", await Error(await Change(Sofia, "Mentor")));
        Assert.Equal("Invite youth from their child record.", await Error(await Change(Leo, "Youth")));
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE Action = 'RoleChanged'"));
    }

    [Fact]
    public async Task Mentor_is_offered_only_while_mentoring_is_on()
    {
        await Modules(AllOn.Except(["Mentoring"]));
        Assert.Equal("Turn on Mentoring to make someone a mentor.", await Error(await Change(Leo, "Mentor")));

        await Modules(AllOn);
        Assert.Equal(HttpStatusCode.NoContent, (await Change(Leo, "Mentor")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Change(Daniel, "Volunteer")).StatusCode);
    }

    private Task<HttpResponseMessage> Change(Guid who, string role) => _factory.ClientFor(Tom).PutAsJsonAsync($"/staff/{who}/role", new { role });

    private static async Task<string?> Error(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("role").GetString();
    }

    private async Task Modules(IEnumerable<string> on) =>
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.ToArray() })).IsSuccessStatusCode);

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
