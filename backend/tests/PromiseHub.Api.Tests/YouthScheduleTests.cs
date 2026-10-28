using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-094 criteria 1, 2, 3 and 5 (her sessions in the next 28 days with her answers; one RSVP per event and youth,
// replaced when she answers again, audited without the note; field-by-field errors; closed when started or cancelled; the consent gate,
// her programs only, tenancy, roles and Roster off), L2-056, L2-007, L2-032, L2-001, L2-005.
public sealed class YouthScheduleTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Trip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Saturday = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid KidsClub = DatabaseSeeder.EventId(DatabaseSeeder.Northgate, "Kids Club night");
    private const string Note = "Can I bring my inhaler on the bus?";

    private readonly PromiseHubApiFactory _factory = new();

    // ---- criterion 1: her schedule

    [Fact]
    public async Task Nadia_sees_the_sessions_of_her_program_in_the_next_four_weeks_soonest_first()
    {
        var sessions = await Schedule(Nadia);

        Assert.Equal(["Tutoring night", "Fall field trip: Royal Botanical Gardens", "Tutoring night", "Tutoring night", "Tutoring night"],
            sessions.Select(s => s.GetProperty("name").GetString()));
        Assert.Equal(["2026-11-12", "2026-11-14", "2026-11-19", "2026-11-26", "2026-12-03"], sessions.Select(s => s.GetProperty("day").GetString()));
        var trip = sessions[1];
        Assert.Equal(Trip, trip.GetProperty("eventId").GetGuid());
        Assert.Equal("After-School Tutoring", trip.GetProperty("programName").GetString());
        Assert.Equal("Royal Botanical Gardens · bus leaves 8:45 am", trip.GetProperty("place").GetString());
        Assert.Equal("Scheduled", trip.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, trip.GetProperty("response").ValueKind);
        Assert.Equal(JsonValueKind.Null, trip.GetProperty("note").ValueKind);
        Assert.DoesNotContain(sessions, s => s.GetProperty("eventId").GetGuid() == Tonight || s.GetProperty("eventId").GetGuid() == Saturday);
    }

    [Fact]
    public async Task A_cancelled_session_stays_on_her_schedule_marked_cancelled()
    {
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/events/{Trip}/cancel", new { message = "", tellGuardians = false });

        var trip = (await Schedule(Nadia)).Single(s => s.GetProperty("eventId").GetGuid() == Trip);

        Assert.Equal("Cancelled", trip.GetProperty("status").GetString());
    }

    // ---- criterion 2: answering

    [Fact]
    public async Task Nadia_answers_going_with_a_note_and_answering_again_replaces_it_audited_without_the_note()
    {
        var going = await Rsvp(Nadia, Trip, new { response = "Going", note = Note });

        Assert.Equal(HttpStatusCode.OK, going.StatusCode);
        var body = await going.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Going", body.GetProperty("response").GetString());
        Assert.Equal(Note, body.GetProperty("note").GetString());
        var trip = (await Schedule(Nadia)).Single(s => s.GetProperty("eventId").GetGuid() == Trip);
        Assert.Equal("Going", trip.GetProperty("response").GetString());
        Assert.Equal(Note, trip.GetProperty("note").GetString());

        Assert.Equal(HttpStatusCode.OK, (await Rsvp(Nadia, Trip, new { response = "Maybe", note = "  " })).StatusCode);

        Assert.Equal(["Maybe "], Query("SELECT Response || ' ' || COALESCE(Note, '') FROM EventRsvps"));
        var audit = Query("SELECT Action || ': ' || Summary || ' ' || COALESCE(AfterJson, '') FROM AuditEntries WHERE RecordType = 'EventRsvp' ORDER BY OccurredAt, Action");
        Assert.Equal(2, audit.Count);
        Assert.StartsWith("Created: Nadia Haddad answered Going for Fall field trip: Royal Botanical Gardens", audit[0]);
        Assert.StartsWith("Updated: Nadia Haddad answered Maybe for Fall field trip: Royal Botanical Gardens", audit[1]);
        Assert.DoesNotContain("inhaler", string.Join(" ", audit));
    }

    // ---- criterion 3: errors and closed sessions

    [Fact]
    public async Task An_answer_is_required_and_must_be_one_of_the_three_and_the_note_at_most_500_characters()
    {
        var none = await Rsvp(Nadia, Trip, new { response = (string?)null, note = "" });
        var odd = await Rsvp(Nadia, Trip, new { response = "Sometimes", note = "" });
        var longNote = await Rsvp(Nadia, Trip, new { response = "Going", note = new string('a', 501) });

        Assert.Equal("Choose whether you’re going.", (await Errors(none)).GetProperty("response").GetString());
        Assert.Equal("Choose whether you’re going.", (await Errors(odd)).GetProperty("response").GetString());
        Assert.Equal("Keep it to 500 characters.", (await Errors(longNote)).GetProperty("note").GetString());
        Assert.Empty(Query("SELECT Id FROM EventRsvps"));
    }

    [Fact]
    public async Task A_session_that_has_started_or_been_cancelled_is_closed_to_RSVPs()
    {
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/events/{Trip}/cancel", new { message = "", tellGuardians = false });

        var started = await Rsvp(Nadia, Tonight, new { response = "Going", note = "" });
        var cancelled = await Rsvp(Nadia, Trip, new { response = "Going", note = "" });

        Assert.Equal(HttpStatusCode.Conflict, started.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, cancelled.StatusCode);
        Assert.Equal("rsvp-closed", (await started.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Empty(Query("SELECT Id FROM EventRsvps"));
    }

    // ---- criterion 5: gates, scope, tenancy and roles

    [Fact]
    public async Task A_session_of_a_program_she_is_not_on_is_refused_and_audited()
    {
        var response = await Rsvp(Nadia, Saturday, new { response = "Going", note = "" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Empty(Query("SELECT Id FROM EventRsvps"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Event'"));
    }

    [Fact]
    public async Task Another_organizations_session_or_an_unknown_one_is_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Rsvp(Nadia, KidsClub, new { response = "Going", note = "" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Rsvp(Nadia, Guid.NewGuid(), new { response = "Going", note = "" })).StatusCode);
    }

    [Fact]
    public async Task A_Northgate_youth_sees_only_Northgates_sessions()
    {
        var grace = _factory.ClientFor(Grace);
        await grace.PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await grace.PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments",
            new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });

        var sessions = await Schedule(Lucia);

        Assert.Equal([KidsClub], sessions.Select(s => s.GetProperty("eventId").GetGuid()));
    }

    [Fact]
    public async Task A_youth_under_the_consent_age_without_consent_is_refused_her_schedule()
    {
        var schedule = await _factory.ClientFor(Sofia).GetAsync("/schedule");
        var rsvp = await Rsvp(Sofia, Trip, new { response = "Going", note = "" });

        Assert.Equal(HttpStatusCode.Forbidden, schedule.StatusCode);
        Assert.Equal("consent-required", (await schedule.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, rsvp.StatusCode);
    }

    [Fact]
    public async Task Staff_and_mentors_have_no_schedule_to_answer()
    {
        foreach (var member in new[] { Marisol, Tom, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(member).GetAsync("/schedule")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Rsvp(member, Trip, new { response = "Going", note = "" })).StatusCode);
        }
    }

    [Fact]
    public async Task With_Roster_off_the_schedule_and_RSVPs_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Nadia).GetAsync("/schedule")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Rsvp(Nadia, Trip, new { response = "Going", note = "" })).StatusCode);
    }

    private Task<HttpResponseMessage> Rsvp(Guid membership, Guid eventId, object body) =>
        _factory.ClientFor(membership).PutAsJsonAsync($"/schedule/{eventId}/rsvp", body);

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    private async Task<List<JsonElement>> Schedule(Guid membership)
    {
        var response = await _factory.ClientFor(membership).GetAsync("/schedule");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return [.. (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("sessions").EnumerateArray()];
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

    public async Task InitializeAsync()
    {
        Assert.True((await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild })).IsSuccessStatusCode);
        var weekly = await _factory.ClientFor(Marisol).PostAsJsonAsync("/events", new
        {
            name = "Tutoring night",
            programId = Tutoring,
            startsAt = "2026-11-12T21:00:00Z",
            endsAt = "2026-11-12T23:00:00Z",
            place = "Harbourview Community Centre, Room 2",
            requiresSlip = false,
            noShowAlert = true,
            staffNotes = "",
            repeatsWeekly = true,
        });
        Assert.Equal(HttpStatusCode.Created, weekly.StatusCode);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
