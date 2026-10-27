using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-088 criteria 1 to 5 and 7 (her progress: lessons, streak, quiz history with best scores and Waiting, the quiz
// average, competencies with their latest levels, attendance only while Roll Call is on, gates, roles, tenancy, Learning off).
public sealed class LearningProgressTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task Overview_counts_lessons_and_the_streak_as_the_journey_does_and_lists_competencies_with_their_latest_levels()
    {
        await Complete(_w.Content.Strengths);
        await Assess(("Speaks up", "Developing"));
        await Assess(("Speaks up", "Proficient"));

        var progress = await Progress(LearningContent.Nadia);
        var journey = await Get(LearningContent.Nadia, "/learning/journey");

        Assert.Equal(1, progress.GetProperty("completedLessons").GetInt32());
        Assert.Equal(journey.GetProperty("totalLessons").GetInt32(), progress.GetProperty("totalLessons").GetInt32());
        Assert.Equal(1, progress.GetProperty("streakWeeks").GetInt32());
        var competencies = progress.GetProperty("competencies").EnumerateArray().ToList();
        Assert.Equal(["Serves others", "Speaks up", "Leads a small group", "Follows through", "Works with others"], competencies.Select(c => c.GetProperty("name").GetString()));
        Assert.Equal("Proficient", competencies[1].GetProperty("level").GetString());
        Assert.Equal("Contributor", competencies[1].GetProperty("stage").GetString());
        Assert.Equal("NotStarted", competencies[0].GetProperty("level").GetString());
    }

    [Fact]
    public async Task The_quiz_history_lists_each_quiz_once_with_its_best_score_and_a_result_waiting_for_the_mentor_has_none()
    {
        var quiz = await _w.Content.QuizAsync(_w.Content.Knowing, attempts: null);
        await _w.TakeAsync(quiz);
        await _w.TakeAsync(quiz, allRight: true);
        var (waiting, _) = await _w.AwaitingQuizAsync("Strengths check");

        var progress = await Progress(LearningContent.Nadia);

        var quizzes = progress.GetProperty("quizzes").EnumerateArray().ToList();
        Assert.Equal(2, quizzes.Count);
        var scored = quizzes.Single(q => q.GetProperty("quizId").GetGuid() == quiz);
        Assert.Equal("Knowing Yourself", scored.GetProperty("moduleTitle").GetString());
        Assert.Equal(100, scored.GetProperty("bestScore").GetInt32());
        Assert.True(scored.GetProperty("passed").GetBoolean());
        Assert.False(scored.GetProperty("waiting").GetBoolean());
        var pending = quizzes.Single(q => q.GetProperty("quizId").GetGuid() == waiting);
        Assert.Equal(JsonValueKind.Null, pending.GetProperty("bestScore").ValueKind);
        Assert.True(pending.GetProperty("waiting").GetBoolean());
        Assert.Equal(100, progress.GetProperty("quizAverage").GetInt32());
    }

    [Fact]
    public async Task With_nothing_submitted_there_is_no_quiz_average()
    {
        var progress = await Progress(LearningContent.Nadia);

        Assert.Empty(progress.GetProperty("quizzes").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, progress.GetProperty("quizAverage").ValueKind);
        Assert.Equal(0, progress.GetProperty("streakWeeks").GetInt32());
    }

    [Fact]
    public async Task Attendance_lists_her_marked_sessions_newest_first_while_Roll_Call_is_on_and_is_absent_when_it_is_off()
    {
        await Mark(LastNight, "absences", LearningContent.NadiaChild);
        await Mark(Tonight, "check-ins", LearningContent.NadiaChild);
        await Mark(Tonight, "check-ins", SofiaChild);

        var attendance = (await Progress(LearningContent.Nadia)).GetProperty("attendance");

        Assert.Equal(1, attendance.GetProperty("attended").GetInt32());
        Assert.Equal(2, attendance.GetProperty("marked").GetInt32());
        var sessions = attendance.GetProperty("sessions").EnumerateArray().ToList();
        Assert.Equal([Tonight, LastNight], sessions.Select(s => s.GetProperty("eventId").GetGuid()));
        Assert.Equal(["Present", "Absent"], sessions.Select(s => s.GetProperty("status").GetString()));
        Assert.Equal("Tutoring night", sessions[0].GetProperty("name").GetString());

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips", "Messages", "Learning", "Mentoring" } });

        Assert.Equal(JsonValueKind.Null, (await Progress(LearningContent.Nadia)).GetProperty("attendance").ValueKind);
    }

    [Fact]
    public async Task The_consent_gate_other_roles_and_Learning_off_answer_before_anything_is_read()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/learning/progress")).StatusCode);
        foreach (var who in new[] { MentorReviewWork.Daniel, LearningContent.Marisol, Jaylen })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/learning/progress")).StatusCode);
        }

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync("/learning/progress")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_youth_reads_only_her_own_organizations_competencies_and_nothing_of_Nadias()
    {
        await Assess(("Serves others", "Mastered"));
        await Mark(Tonight, "check-ins", LearningContent.NadiaChild);
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        var kidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{kidsClub}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });

        var progress = await Progress(Lucia);

        Assert.Equal(["Shows kindness", "Tries new things", "Works with others"], progress.GetProperty("competencies").EnumerateArray().Select(c => c.GetProperty("name").GetString()));
        Assert.All(progress.GetProperty("competencies").EnumerateArray(), c => Assert.Equal("NotStarted", c.GetProperty("level").GetString()));
        Assert.Empty(progress.GetProperty("attendance").GetProperty("sessions").EnumerateArray());
        Assert.Empty(progress.GetProperty("quizzes").EnumerateArray());
    }

    private async Task Mark(Guid session, string what, Guid child)
    {
        var response = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{session}/{what}", new { childId = child, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });
        Assert.True(response.IsSuccessStatusCode, $"{what} answered {response.StatusCode}");
    }

    private async Task Assess(params (string Name, string Level)[] items)
    {
        var response = await _factory.ClientFor(MentorReviewWork.Daniel).PutAsJsonAsync($"/mentoring/youth/{LearningContent.NadiaChild}/competencies", new
        {
            items = items.Select(i => new { competencyId = DatabaseSeeder.CompetencyId(DatabaseSeeder.Harbourview, i.Name), level = i.Level, notes = (string?)null }).ToArray(),
        });
        Assert.True(response.IsSuccessStatusCode, $"assess answered {response.StatusCode}");
    }

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private Task<JsonElement> Progress(Guid membership) => Get(membership, "/learning/progress");

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
