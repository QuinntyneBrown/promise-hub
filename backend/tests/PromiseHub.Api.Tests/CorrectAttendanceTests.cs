using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-097 criteria 4, 5 and 6
// Description: admins and program directors correct a youth's mark at a started session, ended or not, with a reason the audit log keeps.
public sealed class CorrectAttendanceTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");
    private const string Reason = "Nour Haddad emailed on Wednesday morning that Yusuf had a dentist appointment.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_director_corrects_an_absence_to_excused_and_the_audit_keeps_before_after_and_the_reason()
    {
        await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{LastNight}/absences", new { childId = Yusuf, clientActionId = Guid.NewGuid() });

        var response = await Correct(Marisol, LastNight, Yusuf, new { status = "Excused", reason = Reason });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal((0, 1), Marks(await History(), LastNight));
        Assert.Single(Query("SELECT Id FROM AttendanceEvents WHERE Kind = 'Corrected'"));
        var audit = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Attendance' AND Summary LIKE 'Correction%'"));
        Assert.Contains("Yusuf Haddad", audit);
        Assert.Contains("Absent → Excused", audit);
        Assert.Contains(Reason, audit);
    }

    [Fact]
    public async Task A_child_never_marked_can_be_corrected_to_present_or_late_and_back()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await Correct(Marisol, LastNight, Mateo, new { status = "Present", reason = "Signed in on the paper sheet." })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Correct(Tom, LastNight, Jordan, new { status = "Late", reason = "Came at 4:30 pm." })).StatusCode);

        var session = Session(await History(), LastNight);
        Assert.Equal(1, session.GetProperty("present").GetInt32());
        Assert.Equal(1, session.GetProperty("late").GetInt32());

        await Correct(Marisol, LastNight, Jordan, new { status = "Present", reason = "He was on time after all." });
        Assert.Equal(2, Session(await History(), LastNight).GetProperty("present").GetInt32());
    }

    [Fact]
    public async Task An_ended_session_can_still_be_corrected()
    {
        await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/end", new { notCheckedIn = "MarkAbsent", notSignedOut = "LeaveUnsigned" });

        var response = await Correct(Marisol, Tonight, Yusuf, new { status = "Late", reason = "He arrived after Jaylen ended the session." });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(1, Session(await History(), Tonight).GetProperty("late").GetInt32());
    }

    [Fact]
    public async Task A_correction_is_checked_field_by_field()
    {
        var blank = await Errors(await Correct(Marisol, LastNight, Yusuf, new { status = (string?)null, reason = "" }));
        Assert.Equal("Choose a mark.", blank.GetProperty("status").GetString());
        Assert.Equal("Say why you’re correcting it.", blank.GetProperty("reason").GetString());

        var tooLong = await Errors(await Correct(Marisol, LastNight, Yusuf, new { status = "Bogus", reason = new string('a', 501) }));
        Assert.Equal("Choose a mark.", tooLong.GetProperty("status").GetString());
        Assert.Equal("Keep it to 500 characters.", tooLong.GetProperty("reason").GetString());

        Assert.Equal("This session hasn’t started yet.", (await Errors(await Correct(Marisol, FieldTrip, Yusuf, new { status = "Present", reason = Reason }))).GetProperty("session").GetString());
        Assert.Equal("Kevin Tran is not on this cohort’s roster.", (await Errors(await Correct(Marisol, LastNight, Kevin, new { status = "Present", reason = Reason }))).GetProperty("childId").GetString());
        Assert.Empty(Query("SELECT Id FROM AttendanceEvents"));
    }

    [Fact]
    public async Task A_cancelled_session_cannot_be_corrected()
    {
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/events/{LastNight}/cancel", new { message = "Snow day", tellGuardians = false });

        var errors = await Errors(await Correct(Marisol, LastNight, Yusuf, new { status = "Present", reason = Reason }));

        Assert.Equal("This session is cancelled.", errors.GetProperty("session").GetString());
    }

    [Fact]
    public async Task Site_leads_and_mentors_may_not_correct_another_organization_gets_404_and_Roll_Call_off_answers_404()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() });

        Assert.Equal(HttpStatusCode.Forbidden, (await Correct(Jaylen, LastNight, Yusuf, new { status = "Present", reason = Reason })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Correct(Daniel, LastNight, Yusuf, new { status = "Present", reason = Reason })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Correct(Grace, LastNight, Yusuf, new { status = "Present", reason = Reason })).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });
        Assert.Equal(HttpStatusCode.NotFound, (await Correct(Marisol, LastNight, Yusuf, new { status = "Present", reason = Reason })).StatusCode);
    }

    private Task<HttpResponseMessage> Correct(Guid caller, Guid session, Guid child, object body) =>
        _factory.ClientFor(caller).PutAsJsonAsync($"/sessions/{session}/attendance/{child}", body);

    private async Task<JsonElement> History() =>
        await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/attendance?programId={Tutoring}");

    private static JsonElement Session(JsonElement history, Guid id) =>
        history.GetProperty("sessions").EnumerateArray().Single(s => s.GetProperty("eventId").GetGuid() == id);

    private static (int Absent, int Excused) Marks(JsonElement history, Guid id)
    {
        var s = Session(history, id);
        return (s.GetProperty("absent").GetInt32(), s.GetProperty("excused").GetInt32());
    }

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
