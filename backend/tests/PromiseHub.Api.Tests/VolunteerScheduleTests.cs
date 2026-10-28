using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-101 criteria 1 to 5
// Description: a volunteer reads the sessions he is assigned to in the next four weeks, with their status; nothing of another organization.
public sealed class VolunteerScheduleTests : IAsyncLifetime
{
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Priya = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid Saturday = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid KidsClub = DatabaseSeeder.EventId(DatabaseSeeder.Northgate, "Kids Club night");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Leo_reads_the_sessions_he_is_assigned_to_soonest_first_with_the_roster_size_and_whether_it_is_today()
    {
        // A session that has ended is never listed, even when he worked it.
        await Assign(LastNight, Leo);

        var schedule = await _factory.ClientFor(Leo).GetFromJsonAsync<JsonElement>("/sessions/mine");

        var sessions = schedule.GetProperty("sessions").EnumerateArray().ToList();
        Assert.Equal([Tonight, Saturday], sessions.Select(s => s.GetProperty("id").GetGuid()));
        var tonight = sessions[0];
        Assert.Equal("Tutoring night", tonight.GetProperty("name").GetString());
        Assert.Equal("After-School Tutoring", tonight.GetProperty("programName").GetString());
        Assert.Equal("2026-11-05", tonight.GetProperty("day").GetString());
        Assert.Equal("Harbourview Community Centre, Room 2", tonight.GetProperty("place").GetString());
        Assert.Equal(4, tonight.GetProperty("expected").GetInt32());
        Assert.Equal("Scheduled", tonight.GetProperty("status").GetString());
        Assert.True(tonight.GetProperty("today").GetBoolean());
        Assert.Equal("2026-11-07", sessions[1].GetProperty("day").GetString());
        Assert.Equal(2, sessions[1].GetProperty("expected").GetInt32());
        Assert.False(sessions[1].GetProperty("today").GetBoolean());
        // Nothing about any youth.
        Assert.DoesNotContain("Mateo", schedule.GetRawText());
    }

    [Fact]
    public async Task A_cancelled_session_stays_on_his_schedule_marked_cancelled()
    {
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/events/{Saturday}/cancel", new { message = "Gym closed", tellGuardians = false });

        var schedule = await _factory.ClientFor(Leo).GetFromJsonAsync<JsonElement>("/sessions/mine");

        var saturday = schedule.GetProperty("sessions").EnumerateArray().Single(s => s.GetProperty("id").GetGuid() == Saturday);
        Assert.Equal("Cancelled", saturday.GetProperty("status").GetString());
    }

    [Fact]
    public async Task With_no_assignment_his_schedule_is_empty()
    {
        await Assign(Tonight, Jaylen);
        await Assign(Saturday);

        var schedule = await _factory.ClientFor(Leo).GetFromJsonAsync<JsonElement>("/sessions/mine");

        Assert.Equal(0, schedule.GetProperty("sessions").GetArrayLength());
    }

    [Fact]
    public async Task Roles_that_do_not_run_sessions_get_403_and_Roll_Call_off_answers_404()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/sessions/mine")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Priya).GetAsync("/sessions/mine")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Leo).GetAsync("/sessions/mine")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_schedule_never_crosses_tenants()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Grace).PutAsJsonAsync($"/sessions/{KidsClub}/staff", new { membershipIds = new[] { Samuel } })).StatusCode);

        var northgate = await _factory.ClientFor(Samuel).GetFromJsonAsync<JsonElement>("/sessions/mine");
        var harbourview = await _factory.ClientFor(Leo).GetFromJsonAsync<JsonElement>("/sessions/mine");

        Assert.Equal([KidsClub], northgate.GetProperty("sessions").EnumerateArray().Select(s => s.GetProperty("id").GetGuid()));
        Assert.DoesNotContain(harbourview.GetProperty("sessions").EnumerateArray(), s => s.GetProperty("id").GetGuid() == KidsClub);
    }

    private async Task Assign(Guid session, params Guid[] people) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Priya).PutAsJsonAsync($"/sessions/{session}/staff", new { membershipIds = people })).StatusCode);

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
