using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-094 criteria 4 and 5 (staff read how many are going, maybe, can't make it and have not replied, and each
// answer with its note, newest first; no reply counts roster youth who sign in; another organization never sees them), L2-001, L2-007.
public sealed class EventRsvpsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Trip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Saturday = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Saturday Sports");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Before_anyone_answers_every_roster_youth_who_signs_in_has_not_replied()
    {
        var rsvps = await Rsvps(Marisol, Trip);

        Assert.Equal(0, rsvps.GetProperty("going").GetInt32());
        Assert.Equal(0, rsvps.GetProperty("maybe").GetInt32());
        Assert.Equal(0, rsvps.GetProperty("cantMake").GetInt32());
        // Sofía and Nadia sign in; Mateo, Jordan and Yusuf have no youth account.
        Assert.Equal(2, rsvps.GetProperty("noReply").GetInt32());
        Assert.Empty(rsvps.GetProperty("responses").EnumerateArray());
        Assert.Equal(0, (await Rsvps(Marisol, Saturday)).GetProperty("noReply").GetInt32());
    }

    [Fact]
    public async Task Staff_read_the_counts_and_each_answer_with_its_note()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Nadia).PutAsJsonAsync($"/schedule/{Trip}/rsvp", new { response = "Maybe", note = "I might have a shift at work." })).StatusCode);

        var rsvps = await Rsvps(Aisha, Trip);

        Assert.Equal(1, rsvps.GetProperty("maybe").GetInt32());
        Assert.Equal(1, rsvps.GetProperty("noReply").GetInt32());
        var answer = Assert.Single(rsvps.GetProperty("responses").EnumerateArray());
        Assert.Equal(NadiaChild, answer.GetProperty("childId").GetGuid());
        Assert.Equal("Nadia Haddad", answer.GetProperty("childName").GetString());
        Assert.Equal("Maybe", answer.GetProperty("response").GetString());
        Assert.Equal("I might have a shift at work.", answer.GetProperty("note").GetString());
        Assert.Equal(_factory.Clock.GetUtcNow(), answer.GetProperty("answeredAt").GetDateTimeOffset());

        await _factory.ClientFor(Nadia).PutAsJsonAsync($"/schedule/{Trip}/rsvp", new { response = "Going", note = "" });
        var changed = await Rsvps(Marisol, Trip);
        Assert.Equal(1, changed.GetProperty("going").GetInt32());
        Assert.Equal(0, changed.GetProperty("maybe").GetInt32());
    }

    [Fact]
    public async Task Northgate_cannot_read_Harbourviews_event_or_its_answers()
    {
        await _factory.ClientFor(Nadia).PutAsJsonAsync($"/schedule/{Trip}/rsvp", new { response = "Going", note = "" });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/events/{Trip}")).StatusCode);
    }

    private async Task<JsonElement> Rsvps(Guid membership, Guid eventId)
    {
        var response = await _factory.ClientFor(membership).GetAsync($"/events/{eventId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("rsvps");
    }

    public async Task InitializeAsync() =>
        Assert.True((await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild })).IsSuccessStatusCode);

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
