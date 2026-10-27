using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-075 criteria 3, 4 and 8 (starting or resuming an attempt, autosaving answers and position; tenancy, roles and Learning off).
public sealed class LearningQuizAttemptTests : IAsyncLifetime
{
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;
    private Guid _quiz;

    [Fact]
    public async Task Starting_creates_attempt_one_with_its_questions_in_order_and_never_their_answers_and_audits_it()
    {
        var response = await Start(_quiz);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var attempt = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, attempt.GetProperty("number").GetInt32());
        Assert.Equal("Knowing Yourself quiz", attempt.GetProperty("title").GetString());
        Assert.Equal(2, attempt.GetProperty("attemptsAllowed").GetInt32());
        Assert.Equal(0, attempt.GetProperty("position").GetInt32());
        var questions = attempt.GetProperty("questions").EnumerateArray().ToList();
        Assert.Equal(["MultipleChoice", "TrueFalse", "MultipleAnswer", "ShortAnswer"], questions.Select(q => q.GetProperty("type").GetString()));
        Assert.Equal(["True", "False"], questions[1].GetProperty("options").EnumerateArray().Select(o => o.GetString()));
        Assert.Empty(questions[3].GetProperty("options").EnumerateArray());
        Assert.Empty(attempt.GetProperty("answers").EnumerateArray());
        Assert.False(questions[0].TryGetProperty("correct", out _));
        Assert.DoesNotContain("other people", attempt.GetRawText());
        Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'QuizAttempt'"), s => s.Contains("Knowing Yourself quiz"));
    }

    [Fact]
    public async Task Answers_and_position_save_as_she_goes_and_starting_again_resumes_the_same_attempt()
    {
        var attempt = await Started(_quiz);
        var questions = Ids(attempt);

        var saved = await Save(attempt.GetProperty("attemptId").GetGuid(), 2, new { questionId = questions[0], choices = new[] { 1 } }, new { questionId = questions[1], choices = new[] { 1 } }, new { questionId = questions[3], text = "others" });

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var resumed = await Started(_quiz);
        Assert.Equal(attempt.GetProperty("attemptId").GetGuid(), resumed.GetProperty("attemptId").GetGuid());
        Assert.Equal(2, resumed.GetProperty("position").GetInt32());
        var answers = resumed.GetProperty("answers").EnumerateArray().ToList();
        Assert.Equal(3, answers.Count);
        Assert.Equal("others", answers.Single(a => a.GetProperty("questionId").GetGuid() == questions[3]).GetProperty("text").GetString());
        Assert.Single(Query("SELECT Id FROM QuizAttempts"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'QuizAttempt'"));
        var intro = await (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{_quiz}")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, intro.GetProperty("inProgress").GetProperty("answered").GetInt32());
        Assert.Equal(0, intro.GetProperty("attemptsUsed").GetInt32());
        Assert.Equal("in-progress", Assert.Single((await (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/modules/{_c.Knowing}")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("quizzes").EnumerateArray()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Answers_that_do_not_fit_their_questions_are_refused_and_nothing_is_saved()
    {
        var attempt = await Started(_quiz);
        var id = attempt.GetProperty("attemptId").GetGuid();
        var questions = Ids(attempt);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(id, 0, new { questionId = Guid.NewGuid(), choices = new[] { 0 } })).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(id, 0, new { questionId = questions[0], choices = new[] { 0, 1 } })).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(id, 0, new { questionId = questions[1], choices = new[] { 2 } })).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Save(id, 0, new { questionId = questions[3], text = new string('x', 201) })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Save(id, 0, new { questionId = questions[2], choices = new[] { 0, 2 } })).StatusCode);
        Assert.Single((await Started(_quiz)).GetProperty("answers").EnumerateArray());
    }

    [Fact]
    public async Task A_shuffled_quiz_keeps_one_order_for_the_whole_attempt()
    {
        var shuffled = await _c.QuizAsync(_c.Knowing, title: "Shuffled check", shuffle: true);

        var first = Ids(await Started(shuffled));
        var again = Ids(await Started(shuffled));

        Assert.Equal(first, again);
        Assert.Equal(4, first.Distinct().Count());
    }

    [Fact]
    public async Task Locked_quizzes_other_roles_another_organization_and_Learning_off_are_refused()
    {
        var lessonQuiz = await _c.QuizAsync(_c.Serving, _c.Towel, "Towel check");
        Assert.Equal(HttpStatusCode.Forbidden, (await Start(lessonQuiz)).StatusCode);
        Assert.Empty(Query("SELECT Id FROM QuizAttempts"));
        var attempt = (await Started(_quiz)).GetProperty("attemptId").GetGuid();
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).PostAsync($"/learning/quizzes/{_quiz}/attempts", null)).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).PostAsync($"/learning/quizzes/{_quiz}/attempts", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).PutAsJsonAsync($"/learning/attempts/{attempt}/answers", new { answers = Array.Empty<object>(), position = 0 })).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await Start(_quiz)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(attempt, 0)).StatusCode);
    }

    private Task<HttpResponseMessage> Start(Guid quiz) => _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/quizzes/{quiz}/attempts", null);

    private async Task<JsonElement> Started(Guid quiz)
    {
        var response = await Start(quiz);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private Task<HttpResponseMessage> Save(Guid attempt, int position, params object[] answers) =>
        _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/attempts/{attempt}/answers", new { answers, position });

    private static List<Guid> Ids(JsonElement attempt) => attempt.GetProperty("questions").EnumerateArray().Select(q => q.GetProperty("id").GetGuid()).ToList();

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public async Task InitializeAsync()
    {
        _c = await new LearningContent(_factory).BuildAsync();
        _quiz = await _c.QuizAsync(_c.Knowing);
        foreach (var lesson in new[] { _c.Strengths, _c.Values })
        {
            Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);
        }
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
