using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-007 criteria 8 and 11: the participant roles (ADR 0043) reach only what their role was granted.
public sealed class ParticipantRoleTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid TonightId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid YesterdayId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private static readonly string[] StaffEndpoints =
        ["/households", "/children", $"/children/{Mateo}", "/today", "/search?q=Rivera", "/programs", "/events", "/settings/modules", "/staff"];

    private readonly PromiseHubApiFactory _factory = new();

    public static TheoryData<string> Participants => new() { "sofia", "daniel", "leo", "samuel" };

    [Theory]
    [MemberData(nameof(Participants))]
    public async Task A_participant_role_gets_403_from_every_staff_endpoint(string who)
    {
        var client = _factory.ClientFor(Of(who));

        foreach (var path in StaffEndpoints)
        {
            Assert.True(HttpStatusCode.Forbidden == (await client.GetAsync(path)).StatusCode, $"{who} {path}");
        }
    }

    [Theory]
    [MemberData(nameof(Participants))]
    public async Task A_participant_role_reads_their_session_account_and_notifications_like_staff(string who)
    {
        var client = _factory.ClientFor(Of(who));

        var session = await client.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/me/account")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/me/organizations")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/notifications")).StatusCode);
        Assert.Equal(who switch { "sofia" => "Youth", "leo" => "Volunteer", _ => "Mentor" }, session.GetProperty("role").GetString());
    }

    [Fact]
    public async Task A_volunteer_sees_only_the_session_he_is_assigned_to_and_opens_only_its_roster()
    {
        var client = _factory.ClientFor(Leo);

        var today = await client.GetFromJsonAsync<JsonElement>("/sessions/today");
        Assert.Equal([TonightId], today.GetProperty("sessions").EnumerateArray().Select(s => s.GetProperty("id").GetGuid()));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/sessions/{TonightId}/roster")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/sessions/{YesterdayId}/roster")).StatusCode);
    }

    [Fact]
    public async Task A_volunteer_never_reads_medical_fields_on_his_roster()
    {
        var roster = await _factory.ClientFor(Leo).GetStringAsync($"/sessions/{TonightId}/roster");

        Assert.DoesNotContain("EpiPen", roster);
        Assert.DoesNotContain("anaphylaxis", roster);
    }

    [Fact]
    public async Task A_youth_and_a_mentor_cannot_open_session_rosters()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/sessions/today")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/sessions/{TonightId}/roster")).StatusCode);
    }

    private static Guid Of(string who) => who switch
    {
        "sofia" => Sofia,
        "daniel" => Daniel,
        "leo" => Leo,
        _ => Samuel,
    };

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
