using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-081 criteria 1 to 5 (quiz results awaiting approval, approving the auto-score or an override, the
// youth sees only the approved score, approve all, not awaiting, scope, roles, tenancy and modules), L2-073 (the quiz's approval rule),
// L2-032 (every approval audited).
public sealed class MentorQuizApprovalTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task An_author_makes_a_quiz_need_approval_and_its_attempt_waits_in_the_list_with_its_auto_score()
    {
        var quiz = await _w.Content.QuizAsync(_w.Content.Knowing);
        var detail = await (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/curriculum/quizzes/{quiz}")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(detail.GetProperty("requireApproval").GetBoolean());
        Assert.True((await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/curriculum/quizzes/{quiz}",
            new { title = "Knowing Yourself quiz", passMark = 70, attemptsAllowed = (int?)null, feedback = "ShowAnswers", shuffle = false, requiredToComplete = false, requireApproval = true })).IsSuccessStatusCode);
        Assert.True((await (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/curriculum/quizzes/{quiz}")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("requireApproval").GetBoolean());
        var attempt = await _w.TakeAsync(quiz);

        var item = Assert.Single((await Mentor("/mentoring/quiz-approvals")).GetProperty("items").EnumerateArray());

        Assert.Equal(attempt, item.GetProperty("id").GetGuid());
        Assert.Equal("Nadia Haddad", item.GetProperty("youthName").GetString());
        Assert.Equal("Knowing Yourself quiz", item.GetProperty("quizTitle").GetString());
        Assert.Equal("Knowing Yourself", item.GetProperty("moduleTitle").GetString());
        Assert.Equal(1, item.GetProperty("number").GetInt32());
        Assert.Equal(75, item.GetProperty("score").GetInt32());
        Assert.Equal(3, item.GetProperty("correct").GetInt32());
        Assert.Equal(4, item.GetProperty("total").GetInt32());
        Assert.Equal(70, item.GetProperty("passMark").GetInt32());
        Assert.Equal("awaiting-approval", (await Youth($"/learning/attempts/{attempt}")).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Approving_without_an_override_counts_the_auto_score_and_tells_her()
    {
        var (_, attempt) = await _w.AwaitingQuizAsync();

        Assert.Equal(HttpStatusCode.OK, (await Approve(attempt, null)).StatusCode);

        var result = await Youth($"/learning/attempts/{attempt}");
        Assert.Equal("scored", result.GetProperty("status").GetString());
        Assert.Equal(75, result.GetProperty("score").GetInt32());
        Assert.True(result.GetProperty("passed").GetBoolean());
        Assert.Equal(75, result.GetProperty("bestScore").GetInt32());
        Assert.Empty((await Mentor("/mentoring/quiz-approvals")).GetProperty("items").EnumerateArray());
        Assert.Single(_w.Query($"SELECT Text FROM Notifications WHERE upper(MembershipId) = upper('{LearningContent.Nadia}') AND Text LIKE '%Knowing Yourself quiz%'"));
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'QuizAttempt' AND Action = 'Updated'"), s => s.Contains("approved at 75%"));
    }

    [Fact]
    public async Task An_override_from_0_to_100_becomes_the_score_she_sees_and_the_auto_score_is_kept()
    {
        var (_, attempt) = await _w.AwaitingQuizAsync();

        Assert.Equal("Enter a whole number from 0 to 100, or leave it blank.", (await Errors(await Approve(attempt, 150))).GetProperty("override").GetString());
        Assert.Equal(HttpStatusCode.OK, (await Approve(attempt, 60)).StatusCode);

        var result = await Youth($"/learning/attempts/{attempt}");
        Assert.Equal(60, result.GetProperty("score").GetInt32());
        Assert.False(result.GetProperty("passed").GetBoolean());
        Assert.Equal("75", _w.Query($"SELECT AutoScore FROM QuizAttempts WHERE upper(Id) = upper('{attempt}')").Single());
        Assert.Equal("Daniel Osei", _w.Query($"SELECT ApprovedByName FROM QuizAttempts WHERE upper(Id) = upper('{attempt}')").Single());
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'QuizAttempt' AND Action = 'Updated'"), s => s.Contains("approved at 60%") && s.Contains("auto-score 75%"));

        var again = await Approve(attempt, null);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("not-awaiting", (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Approve_all_approves_every_awaiting_result_of_his_youth_at_its_auto_score()
    {
        var (_, first) = await _w.AwaitingQuizAsync();
        var (_, second) = await _w.AwaitingQuizAsync(title: "Second check", allRight: true);

        var response = await _factory.ClientFor(MentorReviewWork.Daniel).PostAsync("/mentoring/quiz-approvals/approve-all", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(2, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("approved").GetInt32());
        Assert.Equal(75, (await Youth($"/learning/attempts/{first}")).GetProperty("score").GetInt32());
        Assert.Equal(100, (await Youth($"/learning/attempts/{second}")).GetProperty("score").GetInt32());
        Assert.Equal(2, _w.Query("SELECT Id FROM AuditEntries WHERE RecordType = 'QuizAttempt' AND Action = 'Updated'").Count);
        Assert.Equal(0, (await (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsync("/mentoring/quiz-approvals/approve-all", null)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("approved").GetInt32());
    }

    [Fact]
    public async Task Another_mentors_youth_another_organization_other_roles_and_modules_off_are_refused()
    {
        var (_, attempt) = await _w.AwaitingQuizAsync();
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Learning", "Mentoring" } });

        Assert.Empty((await Get(MentorReviewWork.Hana, "/mentoring/quiz-approvals")).GetProperty("items").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await Approve(attempt, null, MentorReviewWork.Hana)).StatusCode);
        Assert.Equal(0, (await (await _factory.ClientFor(MentorReviewWork.Hana).PostAsync("/mentoring/quiz-approvals/approve-all", null)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("approved").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await Approve(attempt, null, MentorReviewWork.Samuel)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Approve(Guid.NewGuid(), null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Approve(attempt, null, LearningContent.Marisol)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Approve(attempt, null, LearningContent.Nadia)).StatusCode);
        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Mentoring" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync("/mentoring/quiz-approvals")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Approve(attempt, null)).StatusCode);
        Assert.Equal("AwaitingApproval", _w.Query($"SELECT Status FROM QuizAttempts WHERE upper(Id) = upper('{attempt}')").Single());
    }

    private Task<HttpResponseMessage> Approve(Guid attempt, int? score, Guid? who = null) =>
        _factory.ClientFor(who ?? MentorReviewWork.Daniel).PostAsJsonAsync($"/mentoring/quiz-attempts/{attempt}/approve", new { @override = score });

    private Task<JsonElement> Mentor(string path) => Get(MentorReviewWork.Daniel, path);

    private Task<JsonElement> Youth(string path) => Get(LearningContent.Nadia, path);

    private async Task<JsonElement> Get(Guid who, string path)
    {
        var response = await _factory.ClientFor(who).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
