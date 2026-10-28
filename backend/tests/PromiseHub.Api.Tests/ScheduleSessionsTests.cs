using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-093 criteria 1, 2 and 4 (Repeat weekly creates one event a week at the same local time through the program's
// last day, a draft slip each, audited once; a start after the last day or more than 60 sessions is refused; editing changes one session;
// creating needs ManageEvents; Roster off answers 404; another organization's program answers 422), L2-012, L2-007, L2-032, L2-001, L2-005.
public sealed class ScheduleSessionsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Repeat_weekly_creates_a_session_every_week_at_the_same_local_time_through_the_programs_last_day()
    {
        var response = await Create(Weekly("Tutoring night", "2026-11-12T21:00:00Z", "2026-11-12T23:00:00Z"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(33, body.GetProperty("count").GetInt32());
        var first = body.GetProperty("id").GetGuid();

        var starts = await SeriesStarts();
        Assert.Equal(33, starts.Count);
        Assert.Equal(DateTimeOffset.Parse("2026-11-12T21:00:00Z"), starts[0]);
        // 4:00 pm in Hamilton every week: 21:00Z in standard time, 20:00Z after the clocks go forward on 14 March 2027.
        Assert.Contains(DateTimeOffset.Parse("2027-03-11T21:00:00Z"), starts);
        Assert.Contains(DateTimeOffset.Parse("2027-03-18T20:00:00Z"), starts);
        Assert.Equal(DateTimeOffset.Parse("2027-06-24T20:00:00Z"), starts[^1]);

        var detail = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{first}");
        Assert.Equal(33, detail.GetProperty("seriesSize").GetInt32());
        Assert.Equal(DateTimeOffset.Parse("2026-11-12T23:00:00Z"), detail.GetProperty("endsAt").GetDateTimeOffset());
        var audit = Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Event'");
        Assert.Equal(["Tutoring night (33 weekly sessions)"], audit);
    }

    [Fact]
    public async Task A_single_event_is_not_a_series()
    {
        var response = await Create(Weekly("Swim trip", "2026-11-28T15:00:00Z", "2026-11-28T18:00:00Z", repeats: false));

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, body.GetProperty("count").GetInt32());
        var detail = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{body.GetProperty("id").GetGuid()}");
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("seriesSize").ValueKind);
    }

    [Fact]
    public async Task Every_session_of_a_series_that_needs_a_slip_gets_its_own_draft_slip()
    {
        var before = int.Parse(Query("SELECT COUNT(*) FROM PermissionSlips")[0]);

        await Create(Weekly("Tutoring night", "2027-06-03T20:00:00Z", "2027-06-03T22:00:00Z", slip: true));

        Assert.Equal(before + 4, int.Parse(Query("SELECT COUNT(*) FROM PermissionSlips")[0]));
    }

    [Fact]
    public async Task A_series_starting_after_the_programs_last_day_is_refused()
    {
        var response = await Create(Weekly("Tutoring night", "2027-07-01T20:00:00Z", "2027-07-01T22:00:00Z"));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Start on or before the program’s last day, Thu 24 Jun 2027.", errors.GetProperty("startsAt").GetString());
        Assert.Empty(await SeriesStarts());
    }

    [Fact]
    public async Task A_series_of_more_than_60_sessions_is_refused()
    {
        var program = await _factory.ClientFor(Marisol).PostAsJsonAsync("/programs",
            new { name = "Two-year Robotics", startsOn = "2026-11-01", endsOn = "2028-06-30", schedule = "Tue, 4–6 pm", capacity = 20, ages = "10–14", enrollmentOpen = false, seasonConsent = true });
        var programId = (await program.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var response = await Create(Weekly("Robotics", "2026-11-10T21:00:00Z", "2026-11-10T23:00:00Z", programId: programId));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("A weekly series can have at most 60 sessions.", errors.GetProperty("repeatsWeekly").GetString());
    }

    [Fact]
    public async Task Editing_a_session_of_a_series_changes_that_session_only()
    {
        var first = (await (await Create(Weekly("Tutoring night", "2027-06-03T20:00:00Z", "2027-06-03T22:00:00Z"))).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var edited = await _factory.ClientFor(Marisol).PutAsJsonAsync($"/events/{first}", Weekly("Tutoring night (Room 3)", "2027-06-03T20:00:00Z", "2027-06-03T22:00:00Z"));

        Assert.Equal(HttpStatusCode.NoContent, edited.StatusCode);
        Assert.Equal(4, (await SeriesStarts()).Count);
        Assert.Equal(["Tutoring night (Room 3)", "Tutoring night", "Tutoring night", "Tutoring night"],
            Query("SELECT Name FROM Events WHERE SeriesId IS NOT NULL ORDER BY StartsAt"));
    }

    [Fact]
    public async Task A_youth_worker_cannot_schedule_sessions()
    {
        var response = await _factory.ClientFor(Aisha).PostAsJsonAsync("/events", Weekly("Tutoring night", "2027-06-03T20:00:00Z", "2027-06-03T22:00:00Z"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Empty(await SeriesStarts());
    }

    [Fact]
    public async Task With_Roster_off_a_weekly_series_answers_404_and_nothing_is_saved()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        var response = await Create(Weekly("Tutoring night", "2027-06-03T20:00:00Z", "2027-06-03T22:00:00Z"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("0", Query("SELECT COUNT(*) FROM Events WHERE SeriesId IS NOT NULL")[0]);
    }

    [Fact]
    public async Task Northgate_cannot_schedule_a_weekly_series_for_a_Harbourview_program()
    {
        var response = await _factory.ClientFor(Grace).PostAsJsonAsync("/events", Weekly("Sneaky night", "2027-06-03T20:00:00Z", "2027-06-03T22:00:00Z"));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("0", Query("SELECT COUNT(*) FROM Events WHERE SeriesId IS NOT NULL")[0]);
    }

    private static object Weekly(string name, string startsAt, string endsAt, bool repeats = true, bool slip = false, Guid? programId = null) =>
        new { name, programId = programId ?? Tutoring, startsAt, endsAt, place = "Harbourview Community Centre, Room 2", requiresSlip = slip, noShowAlert = true, staffNotes = "", repeatsWeekly = repeats };

    private Task<HttpResponseMessage> Create(object body) => _factory.ClientFor(Marisol).PostAsJsonAsync("/events", body);

    private async Task<List<DateTimeOffset>> SeriesStarts()
    {
        var list = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/events?filter=upcoming&q=Tutoring");
        var ids = Query("SELECT Id FROM Events WHERE SeriesId IS NOT NULL").Select(id => Guid.Parse(id)).ToHashSet();
        return [.. list.GetProperty("events").EnumerateArray()
            .Where(e => ids.Contains(e.GetProperty("id").GetGuid()))
            .Select(e => e.GetProperty("startsAt").GetDateTimeOffset())
            .OrderBy(s => s)];
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
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
