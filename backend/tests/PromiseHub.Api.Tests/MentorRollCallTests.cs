using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-095 criteria 2 and 5
// Description: a mentor runs the Roll Call sessions of the cohorts on his mentor team, without medical flags, and no other session.
public sealed class MentorRollCallTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_mentor_on_the_cohorts_team_runs_its_session_without_medical_flags()
    {
        await Team(Tutoring, Hana, Daniel);

        var today = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/sessions/today");
        Assert.Equal("Tutoring night", Assert.Single(today.GetProperty("sessions").EnumerateArray()).GetProperty("name").GetString());

        var roster = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>($"/sessions/{Tonight}/roster");
        Assert.Equal(4, roster.GetProperty("children").GetArrayLength());
        Assert.All(roster.GetProperty("children").EnumerateArray(), c => Assert.Equal(JsonValueKind.Null, c.GetProperty("medicalFlag").ValueKind));

        var late = await _factory.ClientFor(Daniel).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = Yusuf, late = true, clientActionId = Guid.NewGuid() });
        Assert.Equal(HttpStatusCode.OK, late.StatusCode);
        var notes = await _factory.ClientFor(Daniel).PutAsJsonAsync($"/sessions/{Tonight}/notes", new { notes = "Yusuf came straight from the dentist." });
        Assert.Equal(HttpStatusCode.NoContent, notes.StatusCode);

        var lead = await _factory.ClientFor(Hana).GetFromJsonAsync<JsonElement>("/sessions/today");
        Assert.Single(lead.GetProperty("sessions").EnumerateArray());
    }

    [Fact]
    public async Task A_mentor_not_on_the_cohorts_team_sees_no_session_and_may_not_open_or_mark_it()
    {
        await Team(Sports, Daniel);

        var today = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/sessions/today");
        Assert.Empty(today.GetProperty("sessions").EnumerateArray());
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/sessions/{Tonight}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = Yusuf, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Hana).GetAsync($"/sessions/{Tonight}/roster")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_mentor_gets_404_a_youth_gets_403_and_Roll_Call_off_answers_404()
    {
        await Team(Tutoring, Daniel);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Samuel).GetAsync($"/sessions/{Tonight}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/sessions/today")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Mentoring" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync("/sessions/today")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/sessions/{Tonight}/roster")).StatusCode);
    }

    private async Task Team(Guid program, Guid lead, params Guid[] supporting) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{program}/mentors", new { leadMentorId = lead, supportingMentorIds = supporting })).StatusCode);

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
