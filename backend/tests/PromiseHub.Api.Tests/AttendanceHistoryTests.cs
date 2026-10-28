using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-097 criteria 1, 2, 3 and 6
// Description: a cohort's attendance by session and by youth with rates, for the roles that may read it and only their cohorts.
public sealed class AttendanceHistoryTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_director_reads_the_first_cohorts_sessions_newest_first_with_counts_rates_and_status_and_each_youth()
    {
        await MarkLastNight();
        await CheckIn(Tonight, Mateo);

        var history = await Get(Marisol, "/attendance");

        Assert.Equal(["After-School Tutoring", "Saturday Sports", "Winter Camp 2026"], history.GetProperty("cohorts").EnumerateArray().Select(c => c.GetProperty("name").GetString()));
        Assert.Equal(Tutoring, history.GetProperty("programId").GetGuid());
        Assert.True(history.GetProperty("canCorrect").GetBoolean());
        var sessions = history.GetProperty("sessions").EnumerateArray().ToList();
        Assert.Equal([Tonight, LastNight], sessions.Select(s => s.GetProperty("eventId").GetGuid()));
        Assert.Equal("InProgress", sessions[0].GetProperty("status").GetString());
        Assert.Equal(1, sessions[0].GetProperty("present").GetInt32());
        Assert.Equal(100, sessions[0].GetProperty("rate").GetInt32());
        var last = sessions[1];
        Assert.Equal((1, 1, 1, 1), (last.GetProperty("present").GetInt32(), last.GetProperty("late").GetInt32(), last.GetProperty("excused").GetInt32(), last.GetProperty("absent").GetInt32()));
        Assert.Equal(50, last.GetProperty("rate").GetInt32());
        Assert.Equal("Recorded", last.GetProperty("status").GetString());

        Assert.Equal(60, history.GetProperty("rate").GetInt32());
        Assert.Equal(2, history.GetProperty("sessionsHeld").GetInt32());
        Assert.Equal(2, history.GetProperty("sessionsRecorded").GetInt32());
        Assert.Equal(2, history.GetProperty("belowThreshold").GetInt32());

        var youth = history.GetProperty("youth").EnumerateArray().ToDictionary(y => y.GetProperty("name").GetString()!);
        Assert.Equal(["Jordan Thompson", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"], youth.Keys);
        Assert.Equal((2, 2, 100, false), Youth(youth["Mateo Rivera"]));
        Assert.Equal(1, youth["Jordan Thompson"].GetProperty("late").GetInt32());
        Assert.Equal((0, 1, 0, true), Youth(youth["Sofía Rivera"]));
        Assert.Equal(1, youth["Sofía Rivera"].GetProperty("excused").GetInt32());
        Assert.Equal(1, youth["Yusuf Haddad"].GetProperty("absent").GetInt32());
    }

    [Fact]
    public async Task A_past_session_with_nothing_marked_is_not_recorded_and_a_partly_marked_one_needs_review()
    {
        var unmarked = Session(await Get(Jaylen, $"/attendance?programId={Tutoring}"), LastNight);
        Assert.Equal("NotRecorded", unmarked.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, unmarked.GetProperty("rate").ValueKind);

        await CheckIn(LastNight, Mateo);

        var history = await Get(Jaylen, $"/attendance?programId={Tutoring}");
        Assert.Equal("NeedsReview", Session(history, LastNight).GetProperty("status").GetString());
        Assert.False(history.GetProperty("canCorrect").GetBoolean());
    }

    [Fact]
    public async Task Choosing_another_cohort_recomputes_for_it_and_a_cohort_with_no_session_yet_is_empty()
    {
        await MarkLastNight();

        var sports = await Get(Marisol, $"/attendance?programId={Sports}");

        Assert.Equal("Saturday Sports", sports.GetProperty("programName").GetString());
        Assert.Empty(sports.GetProperty("sessions").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, sports.GetProperty("rate").ValueKind);
        Assert.Equal(["Emily Tran", "Kevin Tran"], sports.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task A_mentor_chooses_only_his_cohorts_and_another_cohort_is_forbidden_and_audited()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() });

        var mine = await Get(Daniel, "/attendance");
        Assert.Equal(["After-School Tutoring"], mine.GetProperty("cohorts").EnumerateArray().Select(c => c.GetProperty("name").GetString()));
        Assert.False(mine.GetProperty("canCorrect").GetBoolean());

        var other = await _factory.ClientFor(Daniel).GetAsync($"/attendance?programId={Sports}");
        Assert.Equal(HttpStatusCode.Forbidden, other.StatusCode);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Program'"));
    }

    [Fact]
    public async Task A_mentor_with_no_cohort_gets_nothing_to_choose()
    {
        var history = await Get(Daniel, "/attendance");

        Assert.Empty(history.GetProperty("cohorts").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, history.GetProperty("programId").ValueKind);
        Assert.Empty(history.GetProperty("sessions").EnumerateArray());
    }

    [Fact]
    public async Task Youth_workers_volunteer_coordinators_and_youth_may_not_read_history()
    {
        foreach (var caller in new[] { Aisha, PriyaAtHarbourview, Sofia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(caller).GetAsync("/attendance")).StatusCode);
        }
    }

    [Fact]
    public async Task Another_organization_sees_only_its_cohorts_and_a_Harbourview_cohort_is_not_found()
    {
        var mine = await Get(Grace, "/attendance");
        Assert.Equal([KidsClub], mine.GetProperty("cohorts").EnumerateArray().Select(c => c.GetProperty("id").GetGuid()));

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/attendance?programId={Tutoring}")).StatusCode);
    }

    [Fact]
    public async Task With_Roll_Call_off_history_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/attendance")).StatusCode);
    }

    private async Task MarkLastNight()
    {
        await CheckIn(LastNight, Mateo);
        await Post($"/sessions/{LastNight}/check-ins", new { childId = Jordan, late = true, clientActionId = Guid.NewGuid() });
        await Post($"/sessions/{LastNight}/absences", new { childId = SofiaChild, excused = true, clientActionId = Guid.NewGuid() });
        await Post($"/sessions/{LastNight}/absences", new { childId = Yusuf, clientActionId = Guid.NewGuid() });
    }

    private Task CheckIn(Guid session, Guid child) => Post($"/sessions/{session}/check-ins", new { childId = child, clientActionId = Guid.NewGuid() });

    private async Task Post(string path, object body) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).PostAsJsonAsync(path, body)).StatusCode);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static JsonElement Session(JsonElement history, Guid id) =>
        history.GetProperty("sessions").EnumerateArray().Single(s => s.GetProperty("eventId").GetGuid() == id);

    private static (int Attended, int Marked, int Rate, bool Below) Youth(JsonElement y) =>
        (y.GetProperty("attended").GetInt32(), y.GetProperty("marked").GetInt32(), y.GetProperty("rate").GetInt32(), y.GetProperty("belowThreshold").GetBoolean());

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
