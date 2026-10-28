using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-109 criteria 1 to 6 (assigned work notifies the youth, a direct message the other participant without the
// words, an announcement sent now its in-app recipients; each person's own notices; kinds hidden while any of their modules is off and back
// when on; nothing across people or organizations), L2-040, L2-005, L2-001.
public sealed class ReceiveNotificationsTests : IAsyncLifetime
{
    private static readonly Guid Tom = LearningContent.Tom;
    private static readonly Guid Marisol = LearningContent.Marisol;
    private static readonly Guid Daniel = MentorReviewWork.Daniel;
    private static readonly Guid Samuel = MentorReviewWork.Samuel;
    private static readonly Guid Nadia = LearningContent.Nadia;
    private static readonly Guid NadiaChild = LearningContent.NadiaChild;
    private static readonly Guid Tutoring = LearningContent.Tutoring;
    private static readonly string[] AllOn = ["Roster", "RollCall", "Messages", "Incidents", "Learning", "Mentoring"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task Assigned_work_notifies_the_youth_and_not_the_mentor()
    {
        Assert.Equal(HttpStatusCode.Created, (await AssignLastInLine()).StatusCode);

        var notice = Assert.Single(Items(await Get(Nadia)), n => n.GetProperty("kind").GetString() == "assignments");
        Assert.Equal("Daniel Osei assigned you the Last in Line lesson, due Fri 13 Nov.", notice.GetProperty("text").GetString());
        Assert.Equal("/learning", notice.GetProperty("link").GetString());
        Assert.Equal(JsonValueKind.Null, notice.GetProperty("readAt").ValueKind);
        Assert.DoesNotContain(Items(await Get(Daniel)), n => n.GetProperty("kind").GetString() == "assignments");
    }

    [Fact]
    public async Task A_direct_message_notifies_the_other_participant_without_the_words_and_no_supervisor()
    {
        Assert.Equal(HttpStatusCode.Created, (await Write(Daniel, "Good luck with the interview tomorrow.")).StatusCode);

        var notice = Assert.Single(Items(await Get(Nadia)), n => n.GetProperty("kind").GetString() == "messages");
        Assert.Equal("New message from Daniel Osei", notice.GetProperty("text").GetString());
        Assert.Equal($"/conversations/{Nadia}", notice.GetProperty("link").GetString());
        Assert.DoesNotContain(Items(await Get(Daniel)), n => n.GetProperty("kind").GetString() == "messages");
        Assert.DoesNotContain(Items(await Get(Marisol)), n => n.GetProperty("kind").GetString() == "messages");

        await Write(Nadia, "Thanks! I'm nervous.");

        var reply = Assert.Single(Items(await Get(Daniel)), n => n.GetProperty("kind").GetString() == "messages");
        Assert.Equal("New message from Nadia Haddad", reply.GetProperty("text").GetString());
        Assert.DoesNotContain("nervous", reply.GetProperty("text").GetString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task An_announcement_sent_now_notifies_its_in_app_recipients_and_a_scheduled_one_does_not_yet()
    {
        Assert.Equal(HttpStatusCode.Created, (await Announce("Tutoring night moves to Room 2", "Everyone", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Announce("Field day", "Everyone", _factory.Clock.GetUtcNow().AddHours(10))).StatusCode);

        foreach (var who in new[] { Nadia, Daniel })
        {
            var notice = Assert.Single(Items(await Get(who)), n => n.GetProperty("kind").GetString() == "announcements");
            Assert.Equal("Marisol Delgado posted an announcement: Tutoring night moves to Room 2", notice.GetProperty("text").GetString());
            Assert.Equal("/announcements", notice.GetProperty("link").GetString());
        }
        Assert.DoesNotContain(Items(await Get(Marisol)), n => n.GetProperty("kind").GetString() == "announcements");
    }

    [Fact]
    public async Task Each_kind_is_hidden_while_any_of_its_modules_is_off_and_back_when_on()
    {
        await AssignLastInLine();
        await Write(Daniel, "See you Thursday.");
        await Announce("Tutoring night moves to Room 2", "Youth", null);
        Assert.Equal(["announcements", "assignments", "messages"], Kinds(await Get(Nadia)));

        await Modules(AllOn.Except(["Messages"]));
        var off = await Get(Nadia);
        Assert.Equal(["assignments"], Kinds(off));
        Assert.Equal(1, off.GetProperty("unread").GetInt32());

        await Modules(AllOn.Except(["Mentoring"]));
        Assert.Equal(["announcements"], Kinds(await Get(Nadia)));

        await Modules(AllOn.Except(["Learning"]));
        Assert.Equal(["announcements", "messages"], Kinds(await Get(Nadia)));

        await Modules(AllOn);
        Assert.Equal(["announcements", "assignments", "messages"], Kinds(await Get(Nadia)));
    }

    [Fact]
    public async Task Nobody_else_and_no_other_organization_sees_or_reads_her_notices()
    {
        await AssignLastInLine();
        var id = Items(await Get(Nadia)).Single(n => n.GetProperty("kind").GetString() == "assignments").GetProperty("id").GetGuid();

        Assert.Empty(Items(await Get(Samuel)));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Samuel).PostAsync($"/notifications/{id}/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).PostAsync($"/notifications/{id}/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Nadia).PostAsync($"/notifications/{id}/read", null)).StatusCode);
    }

    private Task<HttpResponseMessage> AssignLastInLine() =>
        _factory.ClientFor(Daniel).PostAsJsonAsync("/mentoring/assigned-work",
            new { kind = "Lesson", itemId = _c.Line, childIds = new[] { NadiaChild }, programId = (Guid?)null, dueOn = "2026-11-13", message = (string?)null });

    private Task<HttpResponseMessage> Write(Guid who, string body) =>
        _factory.ClientFor(who).PostAsJsonAsync($"/conversations/{Nadia}/messages", new { body });

    private Task<HttpResponseMessage> Announce(string title, string audience, DateTimeOffset? sendAt) =>
        _factory.ClientFor(Marisol).PostAsJsonAsync("/announcements", new { title, body = "Same time, 4:00 pm.", programId = Tutoring, audience, sendAt });

    private async Task Modules(IEnumerable<string> on) =>
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.ToArray() })).IsSuccessStatusCode);

    private async Task<JsonElement> Get(Guid who) => await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/notifications");

    private static List<JsonElement> Items(JsonElement list) => [.. list.GetProperty("items").EnumerateArray()];

    private static List<string> Kinds(JsonElement list) =>
        [.. Items(list).Select(n => n.GetProperty("kind").GetString()!).Where(k => k is "assignments" or "messages" or "announcements").Order(StringComparer.Ordinal)];

    public async Task InitializeAsync()
    {
        var work = await new MentorReviewWork(_factory).BuildAsync();
        _c = work.Content;
        await Modules(AllOn);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
