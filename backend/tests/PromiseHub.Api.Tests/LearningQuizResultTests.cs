using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-076 criteria 1 to 6 (the score, pass and review as the feedback rule allows, approval, retake, required quizzes and the module).
public sealed class LearningQuizResultTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task The_result_answers_her_score_the_pass_and_a_review_of_every_question()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);
        var attempt = await Take(quiz, wrongTowel: true);

        var result = await Result(attempt);

        Assert.Equal("Knowing Yourself quiz", result.GetProperty("title").GetString());
        Assert.Equal("Knowing Yourself", result.GetProperty("moduleTitle").GetString());
        Assert.Equal("scored", result.GetProperty("status").GetString());
        Assert.Equal(1, result.GetProperty("number").GetInt32());
        Assert.Equal(2, result.GetProperty("attemptsAllowed").GetInt32());
        Assert.Equal(1, result.GetProperty("attemptsLeft").GetInt32());
        Assert.Equal(75, result.GetProperty("score").GetInt32());
        Assert.Equal(3, result.GetProperty("correct").GetInt32());
        Assert.Equal(4, result.GetProperty("total").GetInt32());
        Assert.Equal(70, result.GetProperty("passMark").GetInt32());
        Assert.True(result.GetProperty("passed").GetBoolean());
        Assert.Equal(75, result.GetProperty("bestScore").GetInt32());
        Assert.True(result.GetProperty("canRetake").GetBoolean());
        var review = result.GetProperty("review").EnumerateArray().ToList();
        Assert.Equal([true, true, false, true], review.Select(r => r.GetProperty("right").GetBoolean()));
        Assert.Equal([0], review[2].GetProperty("chosen").EnumerateArray().Select(c => c.GetInt32()));
        Assert.Equal([0, 2], review[2].GetProperty("correctOptions").EnumerateArray().Select(c => c.GetInt32()));
        Assert.Equal("others", review[3].GetProperty("answerText").GetString());
        Assert.Equal(["others", "other people"], review[3].GetProperty("accepted").EnumerateArray().Select(c => c.GetString()));
        Assert.Equal(["Gave the team talk", "Packed the kit bags for everyone", "Went home early"], review[0].GetProperty("options").EnumerateArray().Select(c => c.GetString()));
    }

    [Fact]
    public async Task Score_only_shows_no_review_and_after_the_last_attempt_shows_it_only_then()
    {
        var scoreOnly = await _c.QuizAsync(_c.Knowing, title: "Score only check", feedback: "ScoreOnly");
        var afterLast = await _c.QuizAsync(_c.Knowing, title: "After last check", feedback: "AfterLastAttempt");

        Assert.Empty((await Result(await Take(scoreOnly, wrongTowel: true))).GetProperty("review").EnumerateArray());
        var first = await Result(await Take(afterLast, wrongTowel: true));
        Assert.Empty(first.GetProperty("review").EnumerateArray());
        var last = await Result(await Take(afterLast, wrongTowel: false));
        Assert.Equal(4, last.GetProperty("review").GetArrayLength());
        Assert.Equal(0, last.GetProperty("attemptsLeft").GetInt32());
        Assert.False(last.GetProperty("canRetake").GetBoolean());
        Assert.Equal(100, last.GetProperty("bestScore").GetInt32());
        Assert.Equal(4, (await Result(LastAttempt(afterLast, 1))).GetProperty("review").GetArrayLength());
    }

    [Fact]
    public async Task An_attempt_waiting_for_approval_shows_no_score_pass_or_review()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);
        Execute($"UPDATE Quizzes SET RequireApproval = 1 WHERE upper(Id) = upper('{quiz}')");

        var result = await Result(await Take(quiz, wrongTowel: true));

        Assert.Equal("awaiting-approval", result.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, result.GetProperty("score").ValueKind);
        Assert.Equal(JsonValueKind.Null, result.GetProperty("passed").ValueKind);
        Assert.Equal(JsonValueKind.Null, result.GetProperty("correct").ValueKind);
        Assert.Empty(result.GetProperty("review").EnumerateArray());
    }

    [Fact]
    public async Task A_required_quiz_holds_its_module_and_the_module_that_needs_it_until_it_is_passed()
    {
        var quiz = await _c.QuizAsync(_c.Knowing, required: true);
        await Complete(_c.Strengths);
        await Complete(_c.Values);

        Assert.Equal("in-progress", (await Get($"/learning/modules/{_c.Knowing}")).GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/modules/{_c.Serving}")).StatusCode);
        await Take(quiz, wrongTowel: true, complete: false);

        Assert.Equal("done", (await Get($"/learning/modules/{_c.Knowing}")).GetProperty("status").GetString());
        Assert.Equal("passed", Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("quizzes").EnumerateArray()).GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/modules/{_c.Serving}")).StatusCode);
    }

    [Fact]
    public async Task An_attempt_in_progress_another_organization_and_Learning_off_get_no_result()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);
        var done = await Take(quiz, wrongTowel: true);
        var open = (await (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/quizzes/{quiz}/attempts", null)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("attemptId").GetGuid();

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/attempts/{open}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/attempts/{Guid.NewGuid()}")).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/attempts/{done}")).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/attempts/{done}")).StatusCode);
    }

    /// <summary>Takes and submits an attempt: every answer right, or every one but the multiple answer.</summary>
    private async Task<Guid> Take(Guid quiz, bool wrongTowel, bool complete = true)
    {
        if (complete)
        {
            await Complete(_c.Strengths);
            await Complete(_c.Values);
        }
        var started = await (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/quizzes/{quiz}/attempts", null)).Content.ReadFromJsonAsync<JsonElement>();
        var q = started.GetProperty("questions").EnumerateArray().Select(x => x.GetProperty("id").GetGuid()).ToList();
        var attempt = started.GetProperty("attemptId").GetGuid();
        var answers = new object[]
        {
            new { questionId = q[0], choices = new[] { 1 } },
            new { questionId = q[1], choices = new[] { 1 } },
            new { questionId = q[2], choices = wrongTowel ? new[] { 0 } : new[] { 0, 2 } },
            new { questionId = q[3], text = "others" },
        };
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsJsonAsync($"/learning/attempts/{attempt}/submit", new { answers, position = 3 })).StatusCode);
        return attempt;
    }

    private Guid LastAttempt(Guid quiz, int number) =>
        Guid.Parse(Query($"SELECT Id FROM QuizAttempts WHERE upper(QuizId) = upper('{quiz}') AND Number = {number}").Single());

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private Task<JsonElement> Result(Guid attempt) => Get($"/learning/attempts/{attempt}");

    private async Task<JsonElement> Get(string path)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        Assert.Equal(1, command.ExecuteNonQuery());
    }

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

    public async Task InitializeAsync() => _c = await new LearningContent(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
