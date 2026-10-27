using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-085 criteria 1 to 3 (automatic badges awarded once on learning events: a lesson completed, a module completed,
// a quiz passed, after a mentor's approval when needed, and an assignment accepted; deleted and by-hand badges are never awarded), L2-032.
public sealed class BadgeAwardingTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task Completing_a_lesson_awards_its_badge_once_with_a_notification_and_an_audit_entry()
    {
        var first = await Badge("First Steps", "LessonCompleted", _w.Content.Strengths);
        var other = await Badge("Values Voice", "LessonCompleted", _w.Content.Values);

        await Complete(_w.Content.Strengths);
        await Complete(_w.Content.Strengths);

        var awards = (await Marisol($"/curriculum/badges/{first}")).GetProperty("awards").EnumerateArray().ToList();
        var award = Assert.Single(awards);
        Assert.Equal(LearningContent.Nadia, award.GetProperty("membershipId").GetGuid());
        Assert.Equal("Nadia Haddad", award.GetProperty("youthName").GetString());
        Assert.Equal(JsonValueKind.Null, award.GetProperty("awardedBy").ValueKind);
        Assert.Empty((await Marisol($"/curriculum/badges/{other}")).GetProperty("awards").EnumerateArray());
        var notifications = (await _factory.ClientFor(LearningContent.Nadia).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray();
        Assert.Contains(notifications, n => n.GetProperty("text").GetString() == "You earned the First Steps badge.");
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'BadgeAward'"), s => s.Contains("First Steps earned by Nadia Haddad"));
        Assert.Equal(1, (await Marisol("/curriculum/badges")).GetProperty("awards").GetInt32());
    }

    [Fact]
    public async Task A_module_badge_is_awarded_once_every_published_lesson_of_the_module_is_done()
    {
        var badge = await Badge("Knows Themselves", "ModuleCompleted", _w.Content.Knowing);

        await Complete(_w.Content.Strengths);
        Assert.Empty(await Awards(badge));

        await Complete(_w.Content.Values);
        Assert.Single(await Awards(badge));
    }

    [Fact]
    public async Task A_quiz_badge_is_awarded_when_an_attempt_passes()
    {
        var quiz = await _w.Content.QuizAsync(_w.Content.Knowing, title: "Knowing Yourself quiz", attempts: null);
        var badge = await Badge("Quiz Champion", "QuizPassed", quiz);

        await _w.TakeAsync(quiz);

        Assert.Single(await Awards(badge));
    }

    [Fact]
    public async Task A_quiz_badge_waits_for_the_mentor_to_approve_the_result()
    {
        var (quiz, attempt) = await _w.AwaitingQuizAsync();
        var badge = await Badge("Quiz Champion", "QuizPassed", quiz);
        await _w.TakeAsync(quiz);
        Assert.Empty(await Awards(badge));

        var approved = await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync($"/mentoring/quiz-attempts/{attempt}/approve", new { @override = (int?)null });
        Assert.True(approved.IsSuccessStatusCode, $"approve answered {approved.StatusCode}");

        Assert.Single(await Awards(badge));
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsync("/mentoring/quiz-approvals/approve-all", null)).StatusCode);
        Assert.Single(await Awards(badge));
    }

    [Fact]
    public async Task Approve_all_awards_the_quiz_badges_the_approved_results_earn()
    {
        var (quiz, _) = await _w.AwaitingQuizAsync();
        var badge = await Badge("Quiz Champion", "QuizPassed", quiz);

        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsync("/mentoring/quiz-approvals/approve-all", null)).StatusCode);

        Assert.Single(await Awards(badge));
    }

    [Fact]
    public async Task An_assignment_badge_is_awarded_when_the_mentor_accepts_the_submission()
    {
        var badge = await Badge("Served Someone", "AssignmentAccepted", _w.Assignment);
        var submission = await _w.SubmitAsync();
        Assert.Empty(await Awards(badge));

        var view = await (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/submissions/{submission}")).Content.ReadFromJsonAsync<JsonElement>();
        var scores = view.GetProperty("rubric").EnumerateArray().Select(r => new { criterionId = r.GetProperty("id").GetGuid(), points = 5 }).ToArray();
        var graded = await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync($"/mentoring/submissions/{submission}/grade",
            new { decision = "approve", scores, comment = "Well done.", version = view.GetProperty("version").GetInt32() });
        Assert.True(graded.IsSuccessStatusCode, $"grade answered {graded.StatusCode}");

        Assert.Single(await Awards(badge));
    }

    [Fact]
    public async Task Deleted_by_hand_and_other_organizations_badges_are_never_awarded()
    {
        var deleted = await Badge("Gone", "LessonCompleted", _w.Content.Strengths);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(LearningContent.Marisol).DeleteAsync($"/curriculum/badges/{deleted}")).StatusCode);
        var byHand = await Created(await _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync("/curriculum/badges",
            new { name = "Speaks Up", icon = "flag", kind = "Manual" }));
        var northgate = (await (await _factory.ClientFor(Grace).GetAsync("/settings/modules")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).Append("Learning").ToArray();
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = northgate });
        var track = await Created(await _factory.ClientFor(Grace).PostAsJsonAsync("/curriculum/tracks", new { name = "Kids Club Path" }));
        var module = await Created(await _factory.ClientFor(Grace).PostAsJsonAsync("/curriculum/modules", new { trackId = track, title = "Being Kind" }));
        var lesson = await Created(await _factory.ClientFor(Grace).PostAsJsonAsync("/curriculum/lessons", new { moduleId = module, title = "Sharing" }));
        await Created(await _factory.ClientFor(Grace).PostAsJsonAsync("/curriculum/badges", new { name = "Kind Heart", icon = "heart", kind = "Automatic", rule = "LessonCompleted", targetId = lesson }));

        await Complete(_w.Content.Strengths);

        Assert.Empty(await Awards(byHand));
        Assert.Empty(_w.Query("SELECT Id FROM BadgeAwards"));
        _ = deleted;
    }

    private async Task<Guid> Badge(string name, string rule, Guid target) =>
        await Created(await _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync("/curriculum/badges",
            new { name, icon = "star", kind = "Automatic", rule, targetId = target }));

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private async Task<List<JsonElement>> Awards(Guid badge) => (await Marisol($"/curriculum/badges/{badge}")).GetProperty("awards").EnumerateArray().ToList();

    private async Task<JsonElement> Marisol(string path)
    {
        var response = await _factory.ClientFor(LearningContent.Marisol).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
