using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-007 roles and L2-009 criterion 8: a coordinator sees coverage, assigns staff to sessions and invites youth workers.
public sealed class CoverageTests : IAsyncLifetime
{
    private static readonly Guid Priya = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Coverage_lists_upcoming_sessions_with_who_works_them_and_flags_gaps()
    {
        var coverage = await _factory.ClientFor(Priya).GetFromJsonAsync<JsonElement>("/coverage");

        var sessions = coverage.GetProperty("sessions").EnumerateArray().ToList();
        var tonight = sessions.Single(s => s.GetProperty("id").GetGuid() == Tonight);
        // Leo Martins volunteers tonight (ADR 0043).
        Assert.Equal(["Aisha Bello", "Jaylen Okafor", "Leo Martins"], tonight.GetProperty("staff").EnumerateArray().Select(m => m.GetProperty("name").GetString()).Order());
        var trip = sessions.Single(s => s.GetProperty("id").GetGuid() == FieldTrip);
        Assert.True(trip.GetProperty("gap").GetBoolean());
        Assert.Contains(coverage.GetProperty("people").EnumerateArray(), p => p.GetProperty("name").GetString() == "Aisha Bello");
        // Youth are never staffed onto a session; volunteers and mentors can be.
        Assert.DoesNotContain(coverage.GetProperty("people").EnumerateArray(), p => p.GetProperty("name").GetString() == "Sofía Rivera");
        Assert.Contains(coverage.GetProperty("people").EnumerateArray(), p => p.GetProperty("name").GetString() == "Leo Martins");
    }

    [Fact]
    public async Task A_coordinator_assigns_staff_and_the_youth_worker_can_then_run_the_session()
    {
        var assigned = await _factory.ClientFor(Priya).PutAsJsonAsync($"/sessions/{FieldTrip}/staff", new { membershipIds = new[] { Aisha } });

        Assert.Equal(HttpStatusCode.NoContent, assigned.StatusCode);
        var today = await _factory.ClientFor(Aisha).GetFromJsonAsync<JsonElement>("/coverage/mine");
        Assert.Contains(today.GetProperty("sessions").EnumerateArray(), s => s.GetProperty("id").GetGuid() == FieldTrip);
        Assert.False((await _factory.ClientFor(Priya).GetFromJsonAsync<JsonElement>("/coverage")).GetProperty("sessions").EnumerateArray()
            .Single(s => s.GetProperty("id").GetGuid() == FieldTrip).GetProperty("gap").GetBoolean());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Session' AND Summary LIKE '%staff%'"));
    }

    [Fact]
    public async Task A_coordinator_invites_youth_workers_only()
    {
        var volunteer = await _factory.ClientFor(Priya).PostAsJsonAsync("/staff/invitations", new { email = "sam@harbourview.example", role = "YouthWorker" });
        var director = await _factory.ClientFor(Priya).PostAsJsonAsync("/staff/invitations", new { email = "lee@harbourview.example", role = "ProgramDirector" });

        Assert.Equal(HttpStatusCode.Created, volunteer.StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, director.StatusCode);
        Assert.Equal("Coordinators invite youth workers. Ask an admin for other roles.", (await director.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("role").GetString());
    }

    [Fact]
    public async Task Youth_workers_cannot_assign_and_another_organization_never_sees_or_assigns()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).GetAsync("/coverage")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).PutAsJsonAsync($"/sessions/{FieldTrip}/staff", new { membershipIds = new[] { Aisha } })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PutAsJsonAsync($"/sessions/{FieldTrip}/staff", new { membershipIds = Array.Empty<Guid>() })).StatusCode);
        var unknownPerson = await _factory.ClientFor(Jaylen).PutAsJsonAsync($"/sessions/{FieldTrip}/staff", new { membershipIds = new[] { Grace } });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, unknownPerson.StatusCode);
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
