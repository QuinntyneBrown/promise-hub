using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-073 criteria 1 to 3, 7 and 8 (a quiz and its questions of four types).
public sealed class CurriculumQuizzesTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_new_quiz_is_a_draft_with_the_default_rules_listed_on_its_module_and_audited()
    {
        var (module, lesson, _) = await Module();

        var quiz = await Created(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, title = " Leading by Serving quiz " }));
        await Created(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, lessonId = lesson, title = "Towel check" }));

        var read = await Get(Marisol, $"/curriculum/quizzes/{quiz}");
        Assert.Equal("Leading by Serving quiz", read.GetProperty("title").GetString());
        Assert.Equal("Draft", read.GetProperty("status").GetString());
        Assert.Equal(70, read.GetProperty("passMark").GetInt32());
        Assert.Equal(2, read.GetProperty("attemptsAllowed").GetInt32());
        Assert.Equal("ShowAnswers", read.GetProperty("feedback").GetString());
        Assert.False(read.GetProperty("shuffle").GetBoolean());
        Assert.False(read.GetProperty("requiredToComplete").GetBoolean());
        Assert.Equal(JsonValueKind.Null, read.GetProperty("lessonId").ValueKind);
        Assert.Equal("Leading by Serving", read.GetProperty("moduleTitle").GetString());
        Assert.Equal("Leadership Foundations", read.GetProperty("trackName").GetString());
        Assert.Equal(["Pick Up the Towel"], read.GetProperty("lessons").EnumerateArray().Select(l => l.GetProperty("title").GetString()));
        Assert.Empty(read.GetProperty("questions").EnumerateArray());

        var listed = (await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("quizzes").EnumerateArray().ToList();
        Assert.Equal(["Leading by Serving quiz", "Towel check"], listed.Select(q => q.GetProperty("title").GetString()));
        Assert.Equal(JsonValueKind.Null, listed[0].GetProperty("lessonTitle").ValueKind);
        Assert.Equal("Pick Up the Towel", listed[1].GetProperty("lessonTitle").GetString());
        Assert.Equal(0, listed[0].GetProperty("questionCount").GetInt32());
        Assert.Equal("Draft", listed[0].GetProperty("status").GetString());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Quiz'"), s => s.Contains("Leading by Serving quiz"));
    }

    [Fact]
    public async Task A_quiz_is_refused_without_a_title_with_a_long_title_or_a_lesson_of_another_module()
    {
        var (module, _, track) = await Module();
        var other = await Created(await Post(Marisol, "/curriculum/modules", new { trackId = track, title = "Speaking Up" }));
        var foreign = await Created(await Post(Marisol, "/curriculum/lessons", new { moduleId = other, title = "Finding Your Voice" }));

        Assert.Equal("Give the quiz a title.", await Error(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, title = " " }), "title"));
        Assert.Equal("Keep the title under 120 characters.", await Error(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, title = new string('q', 121) }), "title"));
        Assert.Equal("Choose a lesson of this module.", await Error(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, lessonId = foreign, title = "Quiz" }), "lessonId"));
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, "/curriculum/quizzes", new { moduleId = Guid.NewGuid(), title = "Lost" })).StatusCode);
        Assert.Empty((await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("quizzes").EnumerateArray());
    }

    [Fact]
    public async Task Questions_of_each_type_are_stored_last_with_their_correct_answers_and_audited()
    {
        var quiz = await Quiz();

        Assert.Equal(HttpStatusCode.Created, (await AddQuestion(quiz, "In Pick Up the Towel, what did the captain do?", "MultipleChoice", ["Packed the kit bags", " Went home early ", "Asked for help"], [0])).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await AddQuestion(quiz, "Leading is a title someone gives you.", "TrueFalse", [], [1])).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await AddQuestion(quiz, "Which are ways to pick up the towel?", "MultipleAnswer", ["Clear up", "Wait to be asked", "Welcome someone new"], [0, 2])).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await AddQuestion(quiz, "Who does a servant leader put first?", "ShortAnswer", [], [], [" others ", "other people", ""])).StatusCode);

        var questions = (await Get(Marisol, $"/curriculum/quizzes/{quiz}")).GetProperty("questions").EnumerateArray().ToList();
        Assert.Equal(["MultipleChoice", "TrueFalse", "MultipleAnswer", "ShortAnswer"], questions.Select(q => q.GetProperty("type").GetString()));
        Assert.Equal(["Packed the kit bags", "Went home early", "Asked for help"], Strings(questions[0], "options"));
        Assert.Equal([0], Ints(questions[0], "correct"));
        Assert.Equal(["True", "False"], Strings(questions[1], "options"));
        Assert.Equal([1], Ints(questions[1], "correct"));
        Assert.Equal([0, 2], Ints(questions[2], "correct"));
        Assert.Equal(["others", "other people"], Strings(questions[3], "answers"));
        Assert.Empty(Strings(questions[3], "options"));
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'QuizQuestion'"), s => s.Contains("Who does a servant leader put first?"));
    }

    [Fact]
    public async Task A_question_is_refused_when_its_text_type_options_or_answers_do_not_fit()
    {
        var quiz = await Quiz();

        Assert.Equal("Write the question.", await Error(await AddQuestion(quiz, " ", "MultipleChoice", ["A", "B"], [0]), "text"));
        Assert.Equal("Keep the question under 500 characters.", await Error(await AddQuestion(quiz, new string('q', 501), "MultipleChoice", ["A", "B"], [0]), "text"));
        Assert.Equal("Choose a question type.", await Error(await AddQuestion(quiz, "Q", "Essay", ["A", "B"], [0]), "type"));
        Assert.Equal("Give 2 to 6 options.", await Error(await AddQuestion(quiz, "Q", "MultipleChoice", ["A"], [0]), "options"));
        Assert.Equal("Give 2 to 6 options.", await Error(await AddQuestion(quiz, "Q", "MultipleChoice", ["A", " "], [0]), "options"));
        Assert.Equal("Give 2 to 6 options.", await Error(await AddQuestion(quiz, "Q", "MultipleAnswer", ["A", "B", "C", "D", "E", "F", "G"], [0]), "options"));
        Assert.Equal("Give 2 to 6 options.", await Error(await AddQuestion(quiz, "Q", "MultipleChoice", ["A", new string('o', 201)], [0]), "options"));
        Assert.Equal("Mark the correct answer.", await Error(await AddQuestion(quiz, "Q", "MultipleChoice", ["A", "B"], [0, 1]), "correct"));
        Assert.Equal("Mark the correct answer.", await Error(await AddQuestion(quiz, "Q", "MultipleChoice", ["A", "B"], [2]), "correct"));
        Assert.Equal("Mark the correct answer.", await Error(await AddQuestion(quiz, "Q", "TrueFalse", [], []), "correct"));
        Assert.Equal("Mark at least one correct answer.", await Error(await AddQuestion(quiz, "Q", "MultipleAnswer", ["A", "B"], []), "correct"));
        Assert.Equal("Add at least one accepted answer.", await Error(await AddQuestion(quiz, "Q", "ShortAnswer", [], [], [" "]), "answers"));
        Assert.Empty((await Get(Marisol, $"/curriculum/quizzes/{quiz}")).GetProperty("questions").EnumerateArray());
    }

    [Fact]
    public async Task A_question_is_edited_in_place_and_deleted_with_the_rest_moving_up_both_audited()
    {
        var quiz = await Quiz();
        await AddQuestion(quiz, "First", "TrueFalse", [], [0]);
        await AddQuestion(quiz, "Second", "TrueFalse", [], [0]);
        await AddQuestion(quiz, "Third", "TrueFalse", [], [1]);
        var ids = QuestionIds(await Get(Marisol, $"/curriculum/quizzes/{quiz}"));

        Assert.Equal(HttpStatusCode.NoContent, (await Put(Marisol, $"/curriculum/quiz-questions/{ids[1]}", Question("Second, edited", "MultipleChoice", ["Yes", "No"], [1]))).StatusCode);
        Assert.Equal("Mark the correct answer.", await Error(await Put(Marisol, $"/curriculum/quiz-questions/{ids[1]}", Question("Second", "MultipleChoice", ["Yes", "No"], [])), "correct"));
        var edited = (await Get(Marisol, $"/curriculum/quizzes/{quiz}")).GetProperty("questions")[1];
        Assert.Equal("Second, edited", edited.GetProperty("text").GetString());
        Assert.Equal(["Yes", "No"], Strings(edited, "options"));
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'QuizQuestion'"), a => a.Contains("Second, edited"));

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/quiz-questions/{ids[0]}")).StatusCode);
        var left = (await Get(Marisol, $"/curriculum/quizzes/{quiz}")).GetProperty("questions").EnumerateArray().ToList();
        Assert.Equal(["Second, edited", "Third"], left.Select(q => q.GetProperty("text").GetString()));
        Assert.Equal([1, 2], left.Select(q => q.GetProperty("position").GetInt32()));
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'QuizQuestion'"), s => s.Contains("First"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/quiz-questions/{ids[0]}")).StatusCode);
    }

    [Fact]
    public async Task A_quiz_holds_at_most_fifty_questions()
    {
        var quiz = await Quiz();
        for (var i = 1; i <= 50; i++)
        {
            Assert.Equal(HttpStatusCode.Created, (await AddQuestion(quiz, $"Question {i}", "TrueFalse", [], [0])).StatusCode);
        }

        Assert.Equal("A quiz holds up to 50 questions.", await Error(await AddQuestion(quiz, "One more", "TrueFalse", [], [0]), "text"));
    }

    [Fact]
    public async Task Correct_answers_stay_with_authors_and_other_roles_are_refused()
    {
        var quiz = await Quiz();
        await AddQuestion(quiz, "First", "TrueFalse", [], [0]);
        var question = QuestionIds(await Get(Marisol, $"/curriculum/quizzes/{quiz}"))[0];
        var (module, _, _) = await Module("Second track");

        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).GetAsync($"/curriculum/quizzes/{quiz}")).StatusCode);
        foreach (var who in new[] { Jaylen, Sofia, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/curriculum/quizzes/{quiz}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Post(who, "/curriculum/quizzes", new { moduleId = module, title = "Taken" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await AddQuestion(quiz, "Taken", "TrueFalse", [], [0], who: who)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Put(who, $"/curriculum/quiz-questions/{question}", Question("Taken", "TrueFalse", [], [0]))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).DeleteAsync($"/curriculum/quiz-questions/{question}")).StatusCode);
        }
    }

    [Fact]
    public async Task With_Learning_off_quiz_endpoints_answer_404_and_another_organization_gets_404()
    {
        var (module, _, _) = await Module();
        var quiz = await Created(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, title = "Leading by Serving quiz" }));
        await AddQuestion(quiz, "First", "TrueFalse", [], [0]);
        var question = QuestionIds(await Get(Marisol, $"/curriculum/quizzes/{quiz}"))[0];
        var northgate = await ModulesOn(Grace);
        await Put(Grace, "/settings/modules", new { on = northgate.Append("Learning").ToArray() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/curriculum/quizzes/{quiz}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, "/curriculum/quizzes", new { moduleId = module, title = "Into Harbourview" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await AddQuestion(quiz, "Into Harbourview", "TrueFalse", [], [0], who: Grace)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Grace, $"/curriculum/quiz-questions/{question}", Question("Taken", "TrueFalse", [], [0]))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/curriculum/quiz-questions/{question}")).StatusCode);
        Assert.Equal("First", (await Get(Marisol, $"/curriculum/quizzes/{quiz}")).GetProperty("questions")[0].GetProperty("text").GetString());

        var on = await ModulesOn(Tom);
        await Put(Tom, "/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/curriculum/quizzes/{quiz}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await AddQuestion(quiz, "Off", "TrueFalse", [], [0])).StatusCode);
    }

    private static object Question(string text, string type, string[] options, int[] correct, string[]? answers = null) =>
        new { text, type, options, correct, answers = answers ?? [] };

    private Task<HttpResponseMessage> AddQuestion(Guid quiz, string text, string type, string[] options, int[] correct, string[]? answers = null, Guid? who = null) =>
        Post(who ?? Marisol, $"/curriculum/quizzes/{quiz}/questions", Question(text, type, options, correct, answers));

    private static List<Guid> QuestionIds(JsonElement quiz) => quiz.GetProperty("questions").EnumerateArray().Select(q => q.GetProperty("id").GetGuid()).ToList();

    private static IEnumerable<string?> Strings(JsonElement e, string name) => e.GetProperty(name).EnumerateArray().Select(x => x.GetString());

    private static IEnumerable<int> Ints(JsonElement e, string name) => e.GetProperty(name).EnumerateArray().Select(x => x.GetInt32());

    private async Task<(Guid Module, Guid Lesson, Guid Track)> Module(string trackName = "Leadership Foundations")
    {
        var track = await Created(await Post(Marisol, "/curriculum/tracks", new { name = trackName }));
        var module = await Created(await Post(Marisol, "/curriculum/modules", new { trackId = track, title = "Leading by Serving" }));
        var lesson = await Created(await Post(Marisol, "/curriculum/lessons", new { moduleId = module, title = "Pick Up the Towel" }));
        return (module, lesson, track);
    }

    private async Task<Guid> Quiz()
    {
        var (module, _, _) = await Module();
        return await Created(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, title = "Leading by Serving quiz" }));
    }

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<string[]> ModulesOn(Guid admin) =>
        (await Get(admin, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).ToArray();

    private static async Task<string?> Error(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString();
    }

    private Task<HttpResponseMessage> Post(Guid membership, string path, object body) => _factory.ClientFor(membership).PostAsJsonAsync(path, body);

    private Task<HttpResponseMessage> Put(Guid membership, string path, object body) => _factory.ClientFor(membership).PutAsJsonAsync(path, body);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
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
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
