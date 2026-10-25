using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-012 programs and events, L2-001 tenant isolation, L2-007 roles, L2-032 audit, L2-005 module off.
public sealed class ProgramsAndEventsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Programs_lists_active_programs_with_enrolled_against_capacity()
    {
        var list = await Get(Marisol, "/programs");

        var tutoring = Items(list, "programs").Single(p => p.GetProperty("name").GetString() == "After-School Tutoring");
        Assert.Equal(4, tutoring.GetProperty("enrolled").GetInt32());
        Assert.Equal(50, tutoring.GetProperty("capacity").GetInt32());
        Assert.True(tutoring.GetProperty("enrollmentOpen").GetBoolean());
        Assert.DoesNotContain(Items(list, "programs"), p => p.GetProperty("name").GetString() == "Summer Camp 2026");
        Assert.Contains(Items(await Get(Marisol, "/programs?status=archived"), "programs"), p => p.GetProperty("name").GetString() == "Summer Camp 2026");
    }

    [Fact]
    public async Task A_new_program_starts_with_nobody_enrolled_and_enrollment_closed_unless_opened()
    {
        var response = await Send(Marisol, HttpMethod.Post, "/programs", Program("Spring Robotics", capacity: 12, open: false));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var program = await Get(Marisol, $"/programs/{await Id(response)}");
        Assert.Equal("Spring Robotics", program.GetProperty("name").GetString());
        Assert.Equal(0, program.GetProperty("enrolled").GetInt32());
        Assert.False(program.GetProperty("enrollmentOpen").GetBoolean());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Program'"));
    }

    [Fact]
    public async Task A_program_needs_a_name_dates_in_order_and_a_positive_capacity()
    {
        var response = await Send(Marisol, HttpMethod.Post, "/programs", new { name = "", startsOn = "2027-06-01", endsOn = "2027-01-01", schedule = "", capacity = 0, ages = "", enrollmentOpen = false, seasonConsent = false });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the program name.", errors.GetProperty("name").GetString());
        Assert.Equal("End after it starts.", errors.GetProperty("endsOn").GetString());
        Assert.Equal("Enter a capacity of 1 or more.", errors.GetProperty("capacity").GetString());
    }

    [Fact]
    public async Task Enrolling_adds_a_child_to_the_roster_until_the_program_is_full()
    {
        var full = await Id(await Send(Marisol, HttpMethod.Post, "/programs", Program("Chess Club", capacity: 1, open: true)));

        var first = await Send(Marisol, HttpMethod.Post, $"/programs/{full}/enrollments", new { childId = Amara });
        var second = await Send(Marisol, HttpMethod.Post, $"/programs/{full}/enrollments", new { childId = Mateo });

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, second.StatusCode);
        Assert.Equal("Chess Club is full (1 of 1).", (await second.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("childId").GetString());
        var roster = Items(await Get(Marisol, $"/programs/{full}"), "roster").Select(c => c.GetProperty("name").GetString());
        Assert.Equal(["Amara Okonkwo"], roster);
    }

    [Fact]
    public async Task Children_can_be_found_by_name_to_enroll_them()
    {
        var found = Items(await Get(Marisol, "/children?q=amar"), "children").ToList();

        var amara = Assert.Single(found);
        Assert.Equal("Amara Okonkwo", amara.GetProperty("name").GetString());
        Assert.Equal("Okonkwo", amara.GetProperty("householdName").GetString());
        Assert.Equal(7, amara.GetProperty("age").GetInt32());
        Assert.Empty(Items(await Get(Grace, "/children?q=amar"), "children"));
    }

    [Fact]
    public async Task Removing_a_child_ends_the_enrollment_and_is_audited()
    {
        var response = await Send(Marisol, HttpMethod.Delete, $"/programs/{Tutoring}/enrollments/{Mateo}", new { reason = "Family withdrew" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.DoesNotContain(Items(await Get(Marisol, $"/programs/{Tutoring}"), "roster"), c => c.GetProperty("name").GetString() == "Mateo Rivera");
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'Enrollment'"));
    }

    [Fact]
    public async Task Archiving_needs_the_name_typed_hides_the_program_and_restoring_brings_it_back()
    {
        var wrong = await Send(Marisol, HttpMethod.Post, $"/programs/{Tutoring}/archive", new { confirmName = "Tutoring" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, wrong.StatusCode);

        var archived = await Send(Marisol, HttpMethod.Post, $"/programs/{Tutoring}/archive", new { confirmName = "After-School Tutoring" });
        Assert.Equal(HttpStatusCode.NoContent, archived.StatusCode);
        Assert.DoesNotContain(Items(await Get(Marisol, "/programs"), "programs"), p => p.GetProperty("id").GetGuid() == Tutoring);
        var program = await Get(Marisol, $"/programs/{Tutoring}");
        Assert.Equal("Archived", program.GetProperty("status").GetString());
        Assert.False(program.GetProperty("enrollmentOpen").GetBoolean());

        var restored = await Send(Marisol, HttpMethod.Post, $"/programs/{Tutoring}/restore", new { });
        Assert.Equal(HttpStatusCode.NoContent, restored.StatusCode);
        Assert.Contains(Items(await Get(Marisol, "/programs"), "programs"), p => p.GetProperty("id").GetGuid() == Tutoring);
        Assert.Equal(2, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Program' AND Action IN ('Archived', 'Restored')").Count);
    }

    [Fact]
    public async Task Archived_programs_are_not_offered_for_new_events()
    {
        var summerCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Summer Camp 2026");

        var response = await Send(Marisol, HttpMethod.Post, "/events", Event("Reunion picnic", summerCamp, slip: false));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Choose an active program.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("programId").GetString());
    }

    [Fact]
    public async Task An_event_that_needs_a_slip_starts_with_a_draft_slip()
    {
        var response = await Send(Marisol, HttpMethod.Post, "/events", Event("Swim trip: Jimmy Thompson Pool", Tutoring, slip: true));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await Get(Marisol, $"/events/{await Id(response)}");
        Assert.Equal("Draft", created.GetProperty("slipStatus").GetString());
        Assert.Equal(4, created.GetProperty("rosterSize").GetInt32());
        // The seeded field trip has the other draft.
        Assert.Equal(2, Query("SELECT Id FROM PermissionSlips WHERE Status = 'Draft'").Count);
    }

    [Fact]
    public async Task Events_lists_upcoming_events_and_the_ones_that_need_slips()
    {
        var upcoming = Items(await Get(Jaylen, "/events"), "events").Select(e => e.GetProperty("name").GetString()).ToList();
        var needsSlips = Items(await Get(Jaylen, "/events?filter=needs-slips"), "events").Select(e => e.GetProperty("name").GetString()).ToList();

        Assert.Equal(["Tutoring night", "Saturday Sports", "Fall field trip: Royal Botanical Gardens"], upcoming);
        Assert.Equal(["Fall field trip: Royal Botanical Gardens"], needsSlips);
    }

    [Fact]
    public async Task Cancelling_an_event_needs_a_message_when_guardians_are_told_and_keeps_it_as_cancelled()
    {
        var missing = await Send(Marisol, HttpMethod.Post, $"/events/{FieldTrip}/cancel", new { message = "", tellGuardians = true });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, missing.StatusCode);

        var response = await Send(Marisol, HttpMethod.Post, $"/events/{FieldTrip}/cancel", new { message = "Bus strike. New date soon.", tellGuardians = true });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var trip = await Get(Marisol, $"/events/{FieldTrip}");
        Assert.Equal("Cancelled", trip.GetProperty("status").GetString());
        Assert.Equal("Marisol Delgado", trip.GetProperty("cancelledBy").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Cancelled' AND RecordType = 'Event'"));
    }

    [Fact]
    public async Task Site_leads_create_events_but_cannot_cancel_them_or_create_programs()
    {
        Assert.Equal(HttpStatusCode.Created, (await Send(Jaylen, HttpMethod.Post, "/events", Event("Homework club", Tutoring, slip: false))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Jaylen, HttpMethod.Post, $"/events/{FieldTrip}/cancel", new { message = "x", tellGuardians = false })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Jaylen, HttpMethod.Post, "/programs", Program("X", 1, false))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Aisha, HttpMethod.Post, "/events", Event("Y", Tutoring, slip: false))).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_programs_and_events_are_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/programs/{Tutoring}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/events/{FieldTrip}")).StatusCode);
        Assert.DoesNotContain(Items(await Get(Grace, "/programs"), "programs"), p => p.GetProperty("name").GetString() == "After-School Tutoring");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Send(Grace, HttpMethod.Post, "/events", Event("Sneaky", Tutoring, slip: false))).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_program_and_event_endpoints_answer_404()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/programs")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/events")).StatusCode);
    }

    private static object Program(string name, int capacity, bool open) =>
        new { name, startsOn = "2027-01-10", endsOn = "2027-04-30", schedule = "Wed, 4–6 pm", capacity, ages = "8–13", enrollmentOpen = open, seasonConsent = true };

    private static object Event(string name, Guid programId, bool slip) =>
        new { name, programId, startsAt = "2026-11-28T15:00:00Z", endsAt = "2026-11-28T18:00:00Z", place = "Jimmy Thompson Pool", requiresSlip = slip, noShowAlert = true, staffNotes = "" };

    private async Task<JsonElement> Get(Guid membership, string path) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

    private Task<HttpResponseMessage> Send(Guid membership, HttpMethod method, string path, object body) =>
        _factory.ClientFor(membership).SendAsync(new HttpRequestMessage(method, path) { Content = JsonContent.Create(body) });

    private static async Task<Guid> Id(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

    private static IEnumerable<JsonElement> Items(JsonElement element, string property) => element.GetProperty(property).EnumerateArray();

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
