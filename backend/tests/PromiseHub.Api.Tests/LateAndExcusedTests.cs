using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-095 criteria 1 and 4, L2-098 criterion 2
// Description: a check-in can be late and an absence excused; both keep Roll Call's rules, are audited with their kind and apply once.
public sealed class LateAndExcusedTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_late_check_in_is_present_and_late_counted_in_the_session_and_audited_as_late()
    {
        var response = await Post($"/sessions/{Tonight}/check-ins", new { childId = Jordan, arrivedAt = (string?)null, late = true, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var roster = await Roster();
        var jordan = Row(roster, "Jordan Thompson");
        Assert.Equal("Present", jordan.GetProperty("status").GetString());
        Assert.True(jordan.GetProperty("late").GetBoolean());
        Assert.False(jordan.GetProperty("excused").GetBoolean());
        Assert.False(Row(roster, "Mateo Rivera").GetProperty("late").GetBoolean());
        var session = roster.GetProperty("session");
        Assert.Equal(1, session.GetProperty("checkedIn").GetInt32());
        Assert.Equal(1, session.GetProperty("late").GetInt32());
        Assert.Single(Query("SELECT Id FROM AttendanceEvents WHERE Kind = 'CheckedInLate'"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance' AND Summary LIKE '%CheckedInLate%'"));
    }

    [Fact]
    public async Task An_excused_absence_is_absent_and_excused_and_audited_as_excused()
    {
        var response = await Post($"/sessions/{Tonight}/absences", new { childId = Sofia, excused = true, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var roster = await Roster();
        var sofia = Row(roster, "Sofía Rivera");
        Assert.Equal("Absent", sofia.GetProperty("status").GetString());
        Assert.True(sofia.GetProperty("excused").GetBoolean());
        Assert.Equal(1, roster.GetProperty("session").GetProperty("absent").GetInt32());
        Assert.Equal(1, roster.GetProperty("session").GetProperty("excused").GetInt32());
        Assert.Single(Query("SELECT Id FROM AttendanceEvents WHERE Kind = 'MarkedExcused'"));
    }

    [Fact]
    public async Task Checking_in_an_excused_child_clears_excused_and_a_plain_check_in_is_not_late()
    {
        await Post($"/sessions/{Tonight}/absences", new { childId = Mateo, excused = true, clientActionId = Guid.NewGuid() });
        await Post($"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });

        var mateo = Row(await Roster(), "Mateo Rivera");
        Assert.Equal("Present", mateo.GetProperty("status").GetString());
        Assert.False(mateo.GetProperty("excused").GetBoolean());
        Assert.False(mateo.GetProperty("late").GetBoolean());
    }

    [Fact]
    public async Task A_late_child_stays_late_after_sign_out()
    {
        await Post($"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, late = true, clientActionId = Guid.NewGuid() });
        var carmen = Guid.Parse(Query($"SELECT Id FROM Guardians WHERE Name = 'Carmen Rivera'").Single());

        var signedOut = await Post($"/sessions/{Tonight}/sign-outs", new { childId = Mateo, guardianId = carmen, idChecked = true, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.OK, signedOut.StatusCode);
        var mateo = Row(await Roster(), "Mateo Rivera");
        Assert.Equal("SignedOut", mateo.GetProperty("status").GetString());
        Assert.True(mateo.GetProperty("late").GetBoolean());
    }

    [Fact]
    public async Task A_late_check_in_sent_twice_is_applied_once()
    {
        var action = new { childId = Jordan, arrivedAt = (string?)null, late = true, clientActionId = Guid.NewGuid() };

        Assert.Equal(HttpStatusCode.OK, (await Post($"/sessions/{Tonight}/check-ins", action)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Post($"/sessions/{Tonight}/check-ins", action)).StatusCode);

        Assert.True(Row(await Roster(), "Jordan Thompson").GetProperty("late").GetBoolean());
        Assert.Single(Query("SELECT Id FROM AttendanceEvents"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance'"));
    }

    private Task<HttpResponseMessage> Post(string path, object body) => _factory.ClientFor(Jaylen).PostAsJsonAsync(path, body);

    private async Task<JsonElement> Roster() => await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/sessions/{Tonight}/roster");

    private static JsonElement Row(JsonElement roster, string name) =>
        roster.GetProperty("children").EnumerateArray().Single(r => r.GetProperty("name").GetString() == name);

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
