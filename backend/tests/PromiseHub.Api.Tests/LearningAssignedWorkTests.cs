using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-092 criteria 5, 6 and 7 (the youth sees the work assigned to her on her Learning home, soonest due first,
// with days left, who assigned it and the message; done or hidden work drops off; only her own; hidden while Mentoring is off and back when
// it is on; another organization's youth never sees them), L2-068, L2-065.
public sealed class LearningAssignedWorkTests : IAsyncLifetime
{
    private static readonly Guid Tom = LearningContent.Tom;
    private static readonly Guid Daniel = MentorReviewWork.Daniel;
    private static readonly Guid Nadia = LearningContent.NadiaChild;
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private const string Message = "Read this before Tutoring night next week.";

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _work = null!;
    private LearningContent _c = null!;

    [Fact]
    public async Task Nadia_sees_her_assigned_work_soonest_due_first_with_days_left_who_assigned_it_and_the_message()
    {
        await Assign("Lesson", _c.Line, "2026-11-13", Message);
        await Assign("Assignment", _work.Assignment, "2026-11-06", null);

        var assigned = await Assigned();

        Assert.Equal(["Serve someone this week", "Last in Line"], assigned.Select(a => a.GetProperty("title").GetString()));
        var line = assigned[1];
        Assert.Equal("Lesson", line.GetProperty("kind").GetString());
        Assert.Equal(_c.Line, line.GetProperty("itemId").GetGuid());
        Assert.Equal("Reading", line.GetProperty("lessonKind").GetString());
        Assert.Equal("Leading by Serving", line.GetProperty("moduleTitle").GetString());
        Assert.Equal("2026-11-13", line.GetProperty("dueOn").GetString());
        Assert.Equal(8, line.GetProperty("daysLeft").GetInt32());
        Assert.Equal("Daniel Osei", line.GetProperty("assignedBy").GetString());
        Assert.Equal(Message, line.GetProperty("message").GetString());
        Assert.Equal(1, assigned[0].GetProperty("daysLeft").GetInt32());
        Assert.Equal(JsonValueKind.Null, assigned[0].GetProperty("message").ValueKind);

        _factory.Clock.Advance(TimeSpan.FromDays(2));
        Assert.Equal(-1, (await Assigned())[0].GetProperty("daysLeft").GetInt32());
    }

    [Fact]
    public async Task Work_she_has_done_drops_off_a_lesson_completed_a_quiz_taken_and_an_assignment_handed_in()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);
        await Assign("Lesson", _c.Strengths, "2026-11-13", null);
        await Assign("Quiz", quiz, "2026-11-13", null);
        await Assign("Assignment", _work.Assignment, "2026-11-13", null);
        Assert.Equal(3, (await Assigned()).Count);

        await _work.TakeAsync(quiz);
        await _work.SubmitAsync();

        Assert.Empty(await Assigned());
    }

    [Fact]
    public async Task Work_no_longer_published_and_work_assigned_to_another_youth_are_not_listed()
    {
        await Assign("Lesson", _c.Line, "2026-11-13", null);
        await Assign("Lesson", _c.Towel, "2026-11-13", null, Mateo);
        Assert.True((await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/curriculum/lessons/{_c.Line}/status", new { status = "Draft" })).IsSuccessStatusCode);

        Assert.Empty(await Assigned());
    }

    [Fact]
    public async Task Assigned_work_hides_while_Mentoring_is_off_and_comes_back_when_it_is_on()
    {
        await Assign("Lesson", _c.Line, "2026-11-13", null);

        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Learning" } })).IsSuccessStatusCode);
        Assert.Empty(await Assigned());

        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Learning", "Mentoring" } })).IsSuccessStatusCode);
        Assert.Single(await Assigned());
    }

    [Fact]
    public async Task With_both_modules_on_at_Northgate_its_youth_never_sees_Harbourviews_assigned_work()
    {
        await Assign("Lesson", _c.Line, "2026-11-13", Message);
        var grace = _factory.ClientFor(Grace);
        Assert.True((await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring", "Learning" } })).IsSuccessStatusCode);
        await grace.PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await grace.PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments",
            new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });

        var response = await _factory.ClientFor(Lucia).GetAsync("/learning/home");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("assigned").EnumerateArray());
        Assert.Single(await Assigned());
    }

    private async Task Assign(string kind, Guid itemId, string dueOn, string? message, Guid? child = null)
    {
        var response = await _factory.ClientFor(Daniel).PostAsJsonAsync("/mentoring/assigned-work",
            new { kind, itemId, childIds = new[] { child ?? Nadia }, dueOn, message });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task<List<JsonElement>> Assigned()
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).GetAsync("/learning/home");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return [.. (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("assigned").EnumerateArray()];
    }

    public async Task InitializeAsync()
    {
        _work = await new MentorReviewWork(_factory).BuildAsync();
        _c = _work.Content;
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/programs/{LearningContent.Tutoring}/mentors",
            new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() })).StatusCode);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
