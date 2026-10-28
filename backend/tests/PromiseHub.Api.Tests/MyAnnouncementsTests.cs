using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-105 criteria 3 to 6 and 8 (a youth and a mentor read the announcements aimed at their role and programs,
// sent by now, newest first with who sent them, mark them all read for themselves alone, staff reads counted; scheduled ones hidden; roles,
// tenancy and Messages off). Today at Harbourview is Thu 5 Nov 2026.
public sealed class MyAnnouncementsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Sofia_reads_only_what_is_aimed_at_youth_of_her_programs_and_sent_newest_first_with_who_sent_it()
    {
        await Compose(Tom, "Welcome to Learning", null, "Everyone");
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Compose(Marisol, "Tutoring night moves to Room 2", Tutoring, "Youth");
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Compose(Marisol, "Sports in the gym", Sports, "Youth");
        await Compose(Marisol, "Mentor huddle", null, "Mentors");
        await Compose(Marisol, "Guardians only", Tutoring, "Guardians");
        await Compose(Marisol, "Field day", null, "Everyone", _factory.Clock.GetUtcNow().AddHours(10));

        var mine = await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>("/announcements/mine");

        var items = mine.GetProperty("announcements").EnumerateArray().ToList();
        Assert.Equal(["Tutoring night moves to Room 2", "Welcome to Learning"], items.Select(i => i.GetProperty("title").GetString()));
        Assert.Equal(2, mine.GetProperty("unread").GetInt32());
        var first = items[0];
        Assert.Equal("Marisol Delgado", first.GetProperty("from").GetString());
        Assert.Equal("Program director", first.GetProperty("fromRole").GetString());
        Assert.Equal("After-School Tutoring", first.GetProperty("program").GetString());
        Assert.False(first.GetProperty("read").GetBoolean());
        Assert.Equal(JsonValueKind.Null, items[1].GetProperty("program").ValueKind);
    }

    [Fact]
    public async Task Daniel_reads_the_mentor_announcements_of_his_programs_never_the_youth_ones()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{SofiaChild}/mentor", new { mentorId = Daniel });
        await Compose(Marisol, "Mentor huddle", null, "Mentors");
        await Compose(Marisol, "Tutoring mentors: Room 2", Tutoring, "Mentors");
        await Compose(Marisol, "Sports mentors only", Sports, "Mentors");
        await Compose(Marisol, "Tutoring night moves to Room 2", Tutoring, "Youth");

        var daniel = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/announcements/mine");
        var hana = await _factory.ClientFor(Hana).GetFromJsonAsync<JsonElement>("/announcements/mine");

        Assert.Equal(["Mentor huddle", "Tutoring mentors: Room 2"], daniel.GetProperty("announcements").EnumerateArray().Select(i => i.GetProperty("title").GetString()).Order());
        Assert.Equal("Mentor huddle", Assert.Single(hana.GetProperty("announcements").EnumerateArray()).GetProperty("title").GetString());
    }

    [Fact]
    public async Task Mark_all_read_reads_them_for_Sofia_alone_can_be_repeated_and_counts_on_the_staff_list()
    {
        await Compose(Marisol, "Welcome", null, "Everyone");
        await Compose(Marisol, "Tutoring night moves to Room 2", Tutoring, "Youth");

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Sofia).PostAsync("/announcements/mine/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Sofia).PostAsync("/announcements/mine/read", null)).StatusCode);

        var sofia = await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>("/announcements/mine");
        Assert.Equal(0, sofia.GetProperty("unread").GetInt32());
        Assert.All(sofia.GetProperty("announcements").EnumerateArray(), a => Assert.True(a.GetProperty("read").GetBoolean()));
        var hana = await _factory.ClientFor(Hana).GetFromJsonAsync<JsonElement>("/announcements/mine");
        Assert.Equal(1, hana.GetProperty("unread").GetInt32());
        var rows = (await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements").EnumerateArray().ToList();
        var room = rows.Single(r => r.GetProperty("title").GetString() == "Tutoring night moves to Room 2");
        Assert.Equal(1, room.GetProperty("reads").GetInt32());
        Assert.Equal(1, room.GetProperty("recipients").GetInt32());
    }

    [Fact]
    public async Task Staff_and_volunteers_are_refused_and_a_youth_with_no_program_sees_only_all_program_announcements()
    {
        await Compose(Marisol, "Tutoring night moves to Room 2", Tutoring, "Youth");
        await Compose(Marisol, "Welcome", null, "Youth");

        foreach (var who in new[] { Marisol, Jaylen, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/announcements/mine")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).PostAsync("/announcements/mine/read", null)).StatusCode);
        }
        // Nadia is enrolled in no program, so "all programs" reaches only youth with an enrolled child; she reads nothing.
        Assert.Empty((await _factory.ClientFor(Nadia).GetFromJsonAsync<JsonElement>("/announcements/mine")).GetProperty("announcements").EnumerateArray());
    }

    [Fact]
    public async Task Another_organizations_announcements_never_reach_Sofia_and_with_Messages_off_her_endpoints_answer_404()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } });
        await Compose(Grace, "Kids Club at 6", KidsClub, "Everyone");
        await Compose(Grace, "Northgate news", null, "Youth");

        Assert.Empty((await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>("/announcements/mine")).GetProperty("announcements").EnumerateArray());
        // Lucía's child is enrolled in no Northgate program, so neither reaches her either; Northgate's list holds its own two only.
        Assert.Empty((await _factory.ClientFor(Lucia).GetFromJsonAsync<JsonElement>("/announcements/mine")).GetProperty("announcements").EnumerateArray());
        Assert.Equal(2, (await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements").GetArrayLength());

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Sofia).GetAsync("/announcements/mine")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Sofia).PostAsync("/announcements/mine/read", null)).StatusCode);
    }

    private async Task Compose(Guid who, string title, Guid? programId, string audience, DateTimeOffset? sendAt = null)
    {
        var response = await _factory.ClientFor(who).PostAsJsonAsync("/announcements", new { title, body = $"{title}.", programId, audience, sendAt });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
