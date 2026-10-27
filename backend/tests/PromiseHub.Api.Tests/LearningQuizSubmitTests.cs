using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-075 criteria 5 to 8 (submitting scores an attempt on the server and locks it; the attempt limit; the best attempt counts), L2-076 criterion 3 (approval holds the score back).
public sealed class LearningQuizSubmitTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;
    private Guid _quiz;

    [Fact]
    public async Task Submitting_scores_her_answers_on_the_server_records_a_pass_and_audits_it()
    {
        var (attempt, q) = await Begin(_quiz);

        var submitted = await Submit(attempt, Right(q, wrongTowel: true));

        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
        Assert.Equal(attempt, (await submitted.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
        Assert.Equal(["Scored|75|3|4|1"], Query("SELECT Status || '|' || Score || '|' || Correct || '|' || Total || '|' || Passed FROM QuizAttempts"));
        Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Submitted' AND RecordType = 'QuizAttempt'"), s => s.Contains("75%"));
        var intro = await Intro(_quiz);
        Assert.Equal(1, intro.GetProperty("attemptsUsed").GetInt32());
        Assert.Equal(75, intro.GetProperty("bestScore").GetInt32());
        Assert.True(intro.GetProperty("passed").GetBoolean());
        Assert.Equal(attempt, intro.GetProperty("bestAttemptId").GetGuid());
    }

    [Fact]
    public async Task Short_answers_ignore_capitals_and_spaces_a_multiple_answer_needs_exactly_its_options_and_blanks_are_wrong()
    {
        var (attempt, q) = await Begin(_quiz);

        await Submit(attempt,
            new { questionId = q[0], choices = new[] { 1 } },
            new { questionId = q[2], choices = new[] { 0, 1, 2 } },
            new { questionId = q[3], text = "  Other People " });

        Assert.Equal(["50|2|0"], Query("SELECT Score || '|' || Correct || '|' || Passed FROM QuizAttempts"));
    }

    [Fact]
    public async Task A_submitted_attempt_never_changes()
    {
        var (attempt, q) = await Begin(_quiz);
        await Submit(attempt, Right(q, wrongTowel: true));

        var save = await _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/attempts/{attempt}/answers", new { answers = Right(q, wrongTowel: false), position = 0 });
        var again = await Submit(attempt, Right(q, wrongTowel: false));

        Assert.Equal(HttpStatusCode.Conflict, save.StatusCode);
        Assert.Equal("submitted", (await save.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal(["75"], Query("SELECT Score FROM QuizAttempts"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Submitted'"));
    }

    [Fact]
    public async Task Past_the_limit_another_attempt_is_refused_and_the_best_attempt_counts()
    {
        var (first, q) = await Begin(_quiz);
        await Submit(first, Right(q, wrongTowel: true));
        var (second, _) = await Begin(_quiz);
        Assert.NotEqual(first, second);
        await Submit(second, new { questionId = q[0], choices = new[] { 1 } });

        var third = await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/quizzes/{_quiz}/attempts", null);

        Assert.Equal(HttpStatusCode.Conflict, third.StatusCode);
        Assert.Equal("no-attempts", (await third.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(2, Query("SELECT Id FROM QuizAttempts").Count);
        var intro = await Intro(_quiz);
        Assert.False(intro.GetProperty("canStart").GetBoolean());
        Assert.Equal(2, intro.GetProperty("attemptsUsed").GetInt32());
        Assert.Equal(75, intro.GetProperty("bestScore").GetInt32());
        Assert.Equal(first, intro.GetProperty("bestAttemptId").GetGuid());
        Assert.Equal(second, intro.GetProperty("lastAttemptId").GetGuid());
    }

    [Fact]
    public async Task With_unlimited_attempts_she_can_always_start_another()
    {
        var open = await _c.QuizAsync(_c.Knowing, title: "Open check", attempts: null);
        for (var i = 0; i < 3; i++)
        {
            var (attempt, _) = await Begin(open);
            Assert.Equal(HttpStatusCode.OK, (await Submit(attempt)).StatusCode);
        }
        Assert.Equal(3, (await Intro(open)).GetProperty("attemptsUsed").GetInt32());
    }

    [Fact]
    public async Task A_quiz_whose_scores_a_mentor_approves_holds_the_attempt_back_and_it_does_not_count()
    {
        Execute($"UPDATE Quizzes SET RequireApproval = 1 WHERE upper(Id) = upper('{_quiz}')");
        var (attempt, q) = await Begin(_quiz);

        await Submit(attempt, Right(q, wrongTowel: true));

        Assert.Equal(["AwaitingApproval"], Query("SELECT Status FROM QuizAttempts"));
        var intro = await Intro(_quiz);
        Assert.Equal(JsonValueKind.Null, intro.GetProperty("bestScore").ValueKind);
        Assert.False(intro.GetProperty("passed").GetBoolean());
        Assert.True(intro.GetProperty("awaiting").GetBoolean());
        var module = await (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/modules/{_c.Knowing}")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("awaiting", Assert.Single(module.GetProperty("quizzes").EnumerateArray()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Another_organization_and_Learning_off_cannot_submit()
    {
        var (attempt, q) = await Begin(_quiz);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).PostAsJsonAsync($"/learning/attempts/{attempt}/submit", new { answers = Array.Empty<object>(), position = 0 })).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await Submit(attempt, Right(q, wrongTowel: false))).StatusCode);
        Assert.Equal(["InProgress"], Query("SELECT Status FROM QuizAttempts"));
    }

    /// <summary>Every answer right, or every one but the multiple answer, which then misses its second option.</summary>
    private static object[] Right(List<Guid> q, bool wrongTowel) =>
    [
        new { questionId = q[0], choices = new[] { 1 } },
        new { questionId = q[1], choices = new[] { 1 } },
        new { questionId = q[2], choices = wrongTowel ? new[] { 0 } : new[] { 0, 2 } },
        new { questionId = q[3], text = "others" },
    ];

    private async Task<(Guid Attempt, List<Guid> Questions)> Begin(Guid quiz)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/quizzes/{quiz}/attempts", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var attempt = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (attempt.GetProperty("attemptId").GetGuid(), attempt.GetProperty("questions").EnumerateArray().Select(q => q.GetProperty("id").GetGuid()).ToList());
    }

    private Task<HttpResponseMessage> Submit(Guid attempt, params object[] answers) =>
        _factory.ClientFor(LearningContent.Nadia).PostAsJsonAsync($"/learning/attempts/{attempt}/submit", new { answers, position = 3 });

    private async Task<JsonElement> Intro(Guid quiz) =>
        await (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{quiz}")).Content.ReadFromJsonAsync<JsonElement>();

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
