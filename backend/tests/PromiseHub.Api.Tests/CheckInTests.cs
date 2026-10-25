using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-017 check-in, L2-001 tenant isolation, L2-007 roles, L2-032 audit, L2-005 Roll Call off.
public sealed class CheckInTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid TonightId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Today_lists_tonights_session_with_its_counts()
    {
        var today = await Get(Jaylen, "/sessions/today");

        var tonight = Assert.Single(today.GetProperty("sessions").EnumerateArray());
        Assert.Equal("Tutoring night", tonight.GetProperty("name").GetString());
        Assert.Equal(4, tonight.GetProperty("expected").GetInt32());
        Assert.Equal(0, tonight.GetProperty("checkedIn").GetInt32());
        Assert.Equal(4, tonight.GetProperty("notYet").GetInt32());
        Assert.Empty((await Get(Grace, "/sessions/today")).GetProperty("sessions").EnumerateArray());
    }

    [Fact]
    public async Task The_roster_lists_the_programs_children_not_yet_here_with_their_flags()
    {
        var roster = Children(await Get(Jaylen, $"/sessions/{TonightId}/roster"));

        Assert.Equal(["Jordan Thompson", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"], roster.Select(c => c.GetProperty("name").GetString()));
        Assert.All(roster, c => Assert.Equal("NotYet", c.GetProperty("status").GetString()));
        Assert.Equal("Allergy", roster.Single(c => c.GetProperty("name").GetString() == "Mateo Rivera").GetProperty("medicalFlag").GetString());
    }

    [Fact]
    public async Task One_tap_checks_a_child_in_once_even_when_the_tap_is_sent_twice()
    {
        var action = Guid.NewGuid();

        var first = await Send(Jaylen, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = action });
        var again = await Send(Jaylen, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = action });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        var mateo = Children(await Get(Jaylen, $"/sessions/{TonightId}/roster")).Single(c => c.GetProperty("name").GetString() == "Mateo Rivera");
        Assert.Equal("Present", mateo.GetProperty("status").GetString());
        Assert.Equal("2026-11-05T21:12:00+00:00", mateo.GetProperty("checkedInAt").GetString());
        Assert.Single(Query("SELECT Id FROM AttendanceEvents WHERE Kind = 'CheckedIn'"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance' AND Action = 'Updated'"));
        Assert.Equal(1, (await Get(Jaylen, "/sessions/today")).GetProperty("sessions")[0].GetProperty("checkedIn").GetInt32());
    }

    [Fact]
    public async Task An_earlier_arrival_time_is_stored()
    {
        await Send(Jaylen, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = "2026-11-05T21:02:00Z", clientActionId = Guid.NewGuid() });

        var mateo = Children(await Get(Jaylen, $"/sessions/{TonightId}/roster")).Single(c => c.GetProperty("name").GetString() == "Mateo Rivera");
        Assert.Equal("2026-11-05T21:02:00+00:00", mateo.GetProperty("checkedInAt").GetString());
    }

    [Fact]
    public async Task A_child_marked_absent_can_still_be_checked_in_later()
    {
        var absent = await Send(Jaylen, $"/sessions/{TonightId}/absences", new { childId = Mateo, clientActionId = Guid.NewGuid() });
        Assert.Equal(HttpStatusCode.OK, absent.StatusCode);
        Assert.Equal("Absent", Status(await Get(Jaylen, $"/sessions/{TonightId}/roster"), "Mateo Rivera"));

        await Send(Jaylen, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal("Present", Status(await Get(Jaylen, $"/sessions/{TonightId}/roster"), "Mateo Rivera"));
    }

    [Fact]
    public async Task A_child_not_on_the_programs_roster_cannot_be_checked_in()
    {
        var response = await Send(Jaylen, $"/sessions/{TonightId}/check-ins", new { childId = Kevin, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Kevin Tran is not on tonight’s roster. Add a walk-in instead.", (await Errors(response)).GetProperty("childId").GetString());
    }

    [Fact]
    public async Task A_walk_in_joins_tonights_roster_only_checked_in_and_flagged_for_follow_up()
    {
        var invalid = await Send(Jaylen, $"/sessions/{TonightId}/walk-ins", new { childName = "", guardian = "", medicalNotes = "" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = await Errors(invalid);
        Assert.Equal("Enter the child’s name.", errors.GetProperty("childName").GetString());
        Assert.Equal("Enter the guardian’s name and phone.", errors.GetProperty("guardian").GetString());

        var added = await Send(Jaylen, $"/sessions/{TonightId}/walk-ins", new { childName = "Nikolai Petrov", guardian = "Elena Petrova · 289-555-0150", medicalNotes = "" });

        Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        var nikolai = Children(await Get(Jaylen, $"/sessions/{TonightId}/roster")).Single(c => c.GetProperty("name").GetString() == "Nikolai Petrov");
        Assert.True(nikolai.GetProperty("walkIn").GetBoolean());
        Assert.Equal("Present", nikolai.GetProperty("status").GetString());
        Assert.Single(Query("SELECT Id FROM WalkIns WHERE FollowUp = 1"));
    }

    [Fact]
    public async Task Youth_workers_run_sessions_but_volunteer_coordinators_only_read_them()
    {
        Assert.Equal(HttpStatusCode.OK, (await Send(Aisha, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(PriyaAtHarbourview).GetAsync($"/sessions/{TonightId}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(PriyaAtHarbourview, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
    }

    [Fact]
    public async Task Volunteer_coordinators_see_the_roster_without_medical_flags()
    {
        var roster = Children(await Get(PriyaAtHarbourview, $"/sessions/{TonightId}/roster"));

        Assert.All(roster, c => Assert.Equal(JsonValueKind.Null, c.GetProperty("medicalFlag").ValueKind));
    }

    [Fact]
    public async Task Another_organizations_session_and_child_are_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/sessions/{TonightId}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Grace, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Send(Jaylen, $"/sessions/{TonightId}/check-ins", new { childId = NorthgateMateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
    }

    [Fact]
    public async Task A_cancelled_session_takes_no_check_ins()
    {
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/events/{FieldTrip}/cancel", new { message = "Bus strike", tellGuardians = false });

        var response = await Send(Jaylen, $"/sessions/{FieldTrip}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("This session is cancelled.", (await Errors(response)).GetProperty("session").GetString());
    }

    [Fact]
    public async Task With_Roll_Call_off_session_endpoints_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync("/sessions/today")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync($"/sessions/{TonightId}/roster")).StatusCode);
    }

    private async Task<JsonElement> Get(Guid membership, string path) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

    private Task<HttpResponseMessage> Send(Guid membership, string path, object body) =>
        _factory.ClientFor(membership).PostAsJsonAsync(path, body);

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    private static List<JsonElement> Children(JsonElement roster) => [.. roster.GetProperty("children").EnumerateArray()];

    private static string? Status(JsonElement roster, string name) =>
        Children(roster).Single(c => c.GetProperty("name").GetString() == name).GetProperty("status").GetString();

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
