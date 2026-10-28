using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-093 criteria 3 and 4 (the month's events by the organization's calendar day, the current month by default,
// a program filter, cancelled events marked; Roster off, another organization, participant roles), L2-001, L2-005, L2-007.
public sealed class EventCalendarTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Saturday = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Saturday Sports");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_month_lists_its_events_soonest_first_with_their_calendar_day_program_and_place()
    {
        var calendar = await Calendar(Marisol, "?month=2026-11");

        Assert.Equal("2026-11", calendar.GetProperty("month").GetString());
        Assert.Equal("2026-11-05", calendar.GetProperty("today").GetString());
        var events = calendar.GetProperty("events").EnumerateArray().ToList();
        Assert.Equal(["Tutoring night", "Tutoring night", "Saturday Sports", "Fall field trip: Royal Botanical Gardens"], events.Select(e => e.GetProperty("name").GetString()));
        Assert.Equal(["2026-11-04", "2026-11-05", "2026-11-07", "2026-11-14"], events.Select(e => e.GetProperty("day").GetString()));
        var trip = events[3];
        Assert.Equal("After-School Tutoring", trip.GetProperty("programName").GetString());
        Assert.Equal(Tutoring, trip.GetProperty("programId").GetGuid());
        Assert.Equal("Royal Botanical Gardens · bus leaves 8:45 am", trip.GetProperty("place").GetString());
        Assert.Equal("Scheduled", trip.GetProperty("status").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-11-14T14:00:00Z"), trip.GetProperty("startsAt").GetDateTimeOffset());
    }

    [Fact]
    public async Task With_no_month_it_answers_the_organizations_current_month()
    {
        var calendar = await Calendar(Marisol, "");

        Assert.Equal("2026-11", calendar.GetProperty("month").GetString());
        Assert.Equal(4, calendar.GetProperty("events").GetArrayLength());
    }

    [Fact]
    public async Task An_event_belongs_to_the_month_of_its_local_day_and_a_cancelled_one_is_marked()
    {
        // 10:00 pm on Mon 30 Nov in Hamilton is 1 December in UTC.
        await _factory.ClientFor(Marisol).PostAsJsonAsync("/events", new
        {
            name = "Late study hall",
            programId = Tutoring,
            startsAt = "2026-12-01T03:00:00Z",
            endsAt = "2026-12-01T04:00:00Z",
            place = "Room 2",
            requiresSlip = false,
            noShowAlert = false,
            staffNotes = "",
        });
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/events/{Saturday}/cancel", new { message = "", tellGuardians = false });

        var november = (await Calendar(Marisol, "?month=2026-11")).GetProperty("events").EnumerateArray().ToList();
        var december = (await Calendar(Marisol, "?month=2026-12")).GetProperty("events").EnumerateArray().ToList();

        Assert.Equal("2026-11-30", november.Single(e => e.GetProperty("name").GetString() == "Late study hall").GetProperty("day").GetString());
        Assert.DoesNotContain(december, e => e.GetProperty("name").GetString() == "Late study hall");
        Assert.Equal("Cancelled", november.Single(e => e.GetProperty("id").GetGuid() == Saturday).GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_program_narrows_the_month_to_its_events()
    {
        var events = (await Calendar(Marisol, $"?month=2026-11&programId={Sports}")).GetProperty("events").EnumerateArray().ToList();

        Assert.Equal(["Saturday Sports"], events.Select(e => e.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task A_month_that_is_not_a_month_is_refused()
    {
        var response = await _factory.ClientFor(Marisol).GetAsync("/events/calendar?month=2026-13");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Every_staff_role_reads_the_calendar_and_participant_roles_do_not()
    {
        Assert.Equal(4, (await Calendar(Aisha, "?month=2026-11")).GetProperty("events").GetArrayLength());
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Nadia).GetAsync("/events/calendar?month=2026-11")).StatusCode);
    }

    [Fact]
    public async Task Northgate_sees_only_its_own_events()
    {
        var events = (await Calendar(Grace, "?month=2026-11")).GetProperty("events").EnumerateArray().ToList();

        Assert.Equal(["Kids Club night"], events.Select(e => e.GetProperty("name").GetString()));
        Assert.Empty((await Calendar(Grace, $"?month=2026-11&programId={Tutoring}")).GetProperty("events").EnumerateArray());
    }

    [Fact]
    public async Task With_Roster_off_the_calendar_answers_404()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/events/calendar?month=2026-11")).StatusCode);
    }

    private async Task<JsonElement> Calendar(Guid membership, string query)
    {
        var response = await _factory.ClientFor(membership).GetAsync($"/events/calendar{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
