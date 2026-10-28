using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-100 criteria 3 to 6
// Description: a volunteer takes attendance for the session he is assigned to with Present or Absent only, and nothing else.
public sealed class VolunteerAttendanceTests : IAsyncLifetime
{
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid KidsClub = DatabaseSeeder.EventId(DatabaseSeeder.Northgate, "Kids Club night");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Leo_checks_a_youth_in_and_marks_one_absent_on_his_session_and_each_mark_is_audited()
    {
        var checkedIn = await Post($"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });
        var absent = await Post($"/sessions/{Tonight}/absences", new { childId = Sofia, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.OK, checkedIn.StatusCode);
        Assert.Equal(HttpStatusCode.OK, absent.StatusCode);
        var roster = await _factory.ClientFor(Leo).GetFromJsonAsync<JsonElement>($"/sessions/{Tonight}/roster");
        Assert.Equal(1, roster.GetProperty("session").GetProperty("checkedIn").GetInt32());
        Assert.Equal(1, roster.GetProperty("session").GetProperty("absent").GetInt32());
        Assert.Equal(2, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance' AND ActorName = 'Leo Martins'").Count);
    }

    [Fact]
    public async Task Late_and_excused_are_refused_for_a_volunteer_and_nothing_is_recorded()
    {
        var late = await Post($"/sessions/{Tonight}/check-ins", new { childId = Jordan, arrivedAt = (string?)null, late = true, clientActionId = Guid.NewGuid() });
        var excused = await Post($"/sessions/{Tonight}/absences", new { childId = Sofia, excused = true, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.Forbidden, late.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, excused.StatusCode);
        Assert.Empty(Query("SELECT Id FROM AttendanceEvents"));
        Assert.Empty(Query("SELECT Id FROM AttendanceRecords WHERE Status <> 'NotYet'"));
    }

    [Fact]
    public async Task Another_session_history_and_corrections_are_403_and_another_organizations_session_is_404()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Post($"/sessions/{LastNight}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post($"/sessions/{LastNight}/absences", new { childId = Mateo, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Leo).GetAsync($"/attendance?programId={Tutoring}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Leo).PutAsJsonAsync($"/sessions/{LastNight}/attendance/{Mateo}", new { status = "Present", reason = "He was there" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Leo).GetAsync($"/sessions/{KidsClub}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post($"/sessions/{KidsClub}/check-ins", new { childId = NorthgateMateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
    }

    private Task<HttpResponseMessage> Post(string path, object body) => _factory.ClientFor(Leo).PostAsJsonAsync(path, body);

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
