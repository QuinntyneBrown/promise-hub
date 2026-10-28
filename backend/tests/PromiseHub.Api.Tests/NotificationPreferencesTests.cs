using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-111 criteria 1 to 4 (the kinds a member's role receives whose modules are on, all on until changed; saving
// is audited and a kind turned off creates no notice for that member only; a kind not offered is refused with 422 and a saved choice is kept
// while its module is off; each member's own choices only), L2-109, L2-032, L2-005, L2-001.
public sealed class NotificationPreferencesTests : IAsyncLifetime
{
    private static readonly Guid Tom = LearningContent.Tom;
    private static readonly Guid Marisol = LearningContent.Marisol;
    private static readonly Guid Daniel = MentorReviewWork.Daniel;
    private static readonly Guid Leo = MentorReviewWork.Leo;
    private static readonly Guid Samuel = MentorReviewWork.Samuel;
    private static readonly Guid Nadia = LearningContent.Nadia;
    private static readonly Guid Tutoring = LearningContent.Tutoring;
    private static readonly string[] AllOn = ["Roster", "RollCall", "Messages", "Incidents", "Learning", "Mentoring"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _work = null!;

    [Fact]
    public async Task Each_member_is_offered_the_kinds_their_role_receives_all_on_until_changed()
    {
        var nadia = await Get(Nadia);
        Assert.Equal(["learning", "assignments", "messages", "announcements"], Keys(nadia));
        Assert.All(nadia, k => Assert.True(k.GetProperty("inApp").GetBoolean()));
        var grades = nadia[0];
        Assert.Equal("Grades and badges", grades.GetProperty("name").GetString());
        Assert.Equal("When your work is graded, a quiz score is approved or you earn a badge.", grades.GetProperty("hint").GetString());

        Assert.Equal(["messages", "announcements"], Keys(await Get(Daniel)));
        Assert.Equal(["incidents", "mentoring", "requests"], Keys(await Get(Marisol)));
        Assert.Equal(["incidents", "mentoring", "requests", "staff"], Keys(await Get(Tom)));
        Assert.Empty(await Get(Leo));
    }

    [Fact]
    public async Task Turning_announcements_off_is_audited_and_stops_her_notices_only_until_turned_back_on()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await Save(Nadia, ("announcements", false))).StatusCode);

        Assert.False((await Get(Nadia)).Single(k => k.GetProperty("key").GetString() == "announcements").GetProperty("inApp").GetBoolean());
        Assert.Single(_work.Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'NotificationPreferences' AND Action = 'Updated'"));

        await Announce("Tutoring night moves to Room 2");
        Assert.Equal(0, await Count(Nadia, "announcements"));
        Assert.Equal(1, await Count(Daniel, "announcements"));

        await Save(Nadia, ("announcements", true));
        await Announce("Field day on Saturday");
        Assert.Equal(1, await Count(Nadia, "announcements"));
    }

    [Fact]
    public async Task Turning_messages_off_stops_message_notices_for_her_and_not_for_her_mentor()
    {
        await Save(Nadia, ("messages", false));

        await _factory.ClientFor(Daniel).PostAsJsonAsync($"/conversations/{Nadia}/messages", new { body = "See you Thursday." });
        await _factory.ClientFor(Nadia).PostAsJsonAsync($"/conversations/{Nadia}/messages", new { body = "See you!" });

        Assert.Equal(0, await Count(Nadia, "messages"));
        Assert.Equal(1, await Count(Daniel, "messages"));
    }

    [Fact]
    public async Task A_kind_not_offered_is_refused_and_a_choice_is_kept_while_its_module_is_off()
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(Nadia, ("incidents", false))).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(Nadia, ("weather", false))).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(Daniel, ("learning", false))).StatusCode);

        await Save(Nadia, ("announcements", false));
        await Modules(AllOn.Except(["Messages"]));
        Assert.Equal(["learning", "assignments"], Keys(await Get(Nadia)));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(Nadia, ("messages", false))).StatusCode);

        await Modules(AllOn);
        Assert.False((await Get(Nadia)).Single(k => k.GetProperty("key").GetString() == "announcements").GetProperty("inApp").GetBoolean());
    }

    [Fact]
    public async Task Choices_are_the_callers_own_and_another_organizations_are_untouched()
    {
        await Save(Daniel, ("messages", false));

        Assert.DoesNotContain(await Get(Samuel), k => !k.GetProperty("inApp").GetBoolean());
        Assert.True((await Get(Nadia)).Single(k => k.GetProperty("key").GetString() == "messages").GetProperty("inApp").GetBoolean());
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync("/notifications/preferences")).StatusCode);
    }

    private async Task<List<JsonElement>> Get(Guid who)
    {
        var body = await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/notifications/preferences");
        return [.. body.GetProperty("kinds").EnumerateArray()];
    }

    private static List<string> Keys(List<JsonElement> kinds) => [.. kinds.Select(k => k.GetProperty("key").GetString()!)];

    private Task<HttpResponseMessage> Save(Guid who, params (string Key, bool InApp)[] kinds) =>
        _factory.ClientFor(who).PutAsJsonAsync("/notifications/preferences", new { kinds = kinds.Select(k => new { key = k.Key, inApp = k.InApp }) });

    private async Task Announce(string title) =>
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(Marisol).PostAsJsonAsync("/announcements",
            new { title, body = "Same time, 4:00 pm.", programId = Tutoring, audience = "Everyone", sendAt = (DateTimeOffset?)null })).StatusCode);

    private async Task<int> Count(Guid who, string kind) =>
        (await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray()
            .Count(n => n.GetProperty("kind").GetString() == kind);

    private async Task Modules(IEnumerable<string> on) =>
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.ToArray() })).IsSuccessStatusCode);

    public async Task InitializeAsync()
    {
        _work = await new MentorReviewWork(_factory).BuildAsync();
        await Modules(AllOn);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
