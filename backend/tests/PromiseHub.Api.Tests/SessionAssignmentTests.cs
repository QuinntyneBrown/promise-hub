using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-007 criterion 6 youth workers run only assigned sessions, L2-017 check-in and sign-out, L2-001 tenant isolation, L2-005 Roll Call off.
public sealed class SessionAssignmentTests : IAsyncLifetime
{
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid TonightId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid YesterdayId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid KidsClubNight = DatabaseSeeder.EventId(DatabaseSeeder.Northgate, "Kids Club night");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_youth_worker_sees_only_the_sessions_they_are_assigned_to()
    {
        await AddHomeworkClubTonight();

        Assert.Equal(["Tutoring night"], await TodayNames(Aisha));
        Assert.Equal(["Tutoring night", "Homework club"], await TodayNames(Jaylen));
        Assert.Equal(["Tutoring night", "Homework club"], await TodayNames(PriyaAtHarbourview));
    }

    [Fact]
    public async Task A_youth_worker_checks_in_and_signs_out_on_their_session_like_a_site_lead()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Aisha).GetAsync($"/sessions/{TonightId}/roster")).StatusCode);

        var checkIn = await Post(Aisha, $"/sessions/{TonightId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });
        var carmen = (await _factory.ClientFor(Aisha).GetFromJsonAsync<JsonElement>($"/children/{Mateo}/pickups")).GetProperty("approved")[0].GetProperty("guardianId").GetGuid();
        var signOut = await Post(Aisha, $"/sessions/{TonightId}/sign-outs", new { childId = Mateo, guardianId = carmen, someoneElse = false, idChecked = true, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.OK, checkIn.StatusCode);
        Assert.Equal(HttpStatusCode.OK, signOut.StatusCode);
    }

    [Fact]
    public async Task A_session_the_youth_worker_is_not_assigned_to_answers_403_for_every_action()
    {
        var client = _factory.ClientFor(Aisha);

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/sessions/{YesterdayId}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(Aisha, $"/sessions/{YesterdayId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(Aisha, $"/sessions/{YesterdayId}/absences", new { childId = Mateo, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(Aisha, $"/sessions/{YesterdayId}/walk-ins", new { childName = "Nikolai Petrov", guardian = "Elena Petrova · 289-555-0150", medicalNotes = "" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(Aisha, $"/sessions/{YesterdayId}/sign-outs", new { childId = Mateo, someoneElse = true, otherName = "Daniel Rivera", guardianConfirmed = true, idChecked = true, clientActionId = Guid.NewGuid() })).StatusCode);
    }

    [Fact]
    public async Task Site_leads_and_directors_run_any_session_without_an_assignment()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync($"/sessions/{YesterdayId}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Post(Marisol, $"/sessions/{YesterdayId}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_session_is_not_found_rather_than_forbidden()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).GetAsync($"/sessions/{KidsClubNight}/roster")).StatusCode);
    }

    [Fact]
    public async Task With_Roll_Call_off_the_youth_workers_sessions_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).GetAsync("/sessions/today")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).GetAsync($"/sessions/{TonightId}/roster")).StatusCode);
    }

    private async Task AddHomeworkClubTonight()
    {
        var created = await Post(Marisol, "/events", new
        {
            name = "Homework club",
            programId = Tutoring,
            startsAt = "2026-11-05T23:00:00Z",
            endsAt = "2026-11-06T00:00:00Z",
            place = "Room 3",
            requiresSlip = false,
            noShowAlert = true,
            staffNotes = (string?)null,
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
    }

    private async Task<List<string?>> TodayNames(Guid membership) =>
        [.. (await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/sessions/today")).GetProperty("sessions").EnumerateArray().Select(s => s.GetProperty("name").GetString())];

    private Task<HttpResponseMessage> Post(Guid membership, string path, object body) =>
        _factory.ClientFor(membership).PostAsJsonAsync(path, body);

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
