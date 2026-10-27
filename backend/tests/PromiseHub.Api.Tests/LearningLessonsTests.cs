using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-069 (lesson delivery and completion), L2-068 criteria 3 to 7 (locks, visibility, gates, tenancy).
public sealed class LearningLessonsTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task A_lesson_answers_what_she_reads_with_its_place_in_the_module_and_never_the_leader_notes()
    {
        var lesson = await Get(LearningContent.Nadia, $"/learning/lessons/{_c.Strengths}");

        Assert.Equal("Reading", lesson.GetProperty("kind").GetString());
        Assert.Equal("Your Strengths", lesson.GetProperty("title").GetString());
        Assert.Equal("The captain and the kit bags", lesson.GetProperty("reading").GetString());
        Assert.Equal(10, lesson.GetProperty("minutes").GetInt32());
        Assert.Equal(["Notice what needs doing"], lesson.GetProperty("objectives").EnumerateArray().Select(o => o.GetString()));
        Assert.Equal("Everyone is good at something.", lesson.GetProperty("body").GetString());
        Assert.Equal(["Who picked up the towel for you?"], lesson.GetProperty("prompts").EnumerateArray().Select(o => o.GetString()));
        Assert.Equal(1, lesson.GetProperty("position").GetInt32());
        Assert.Equal(2, lesson.GetProperty("lessonCount").GetInt32());
        Assert.Equal("Knowing Yourself", lesson.GetProperty("moduleTitle").GetString());
        Assert.False(lesson.GetProperty("hasVideo").GetBoolean());
        Assert.False(lesson.GetProperty("done").GetBoolean());
        Assert.False(lesson.TryGetProperty("leaderNotes", out _));
        Assert.DoesNotContain("Watch for youth", lesson.GetRawText());
    }

    [Fact]
    public async Task A_later_lesson_is_locked_for_reading_and_completing_until_the_one_before_is_done()
    {
        var read = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Values}");
        Assert.Equal(HttpStatusCode.Forbidden, read.StatusCode);
        var body = await read.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("locked", body.GetProperty("code").GetString());
        Assert.Equal("Your Strengths", body.GetProperty("unlockAfter").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await Complete(LearningContent.Nadia, _c.Values)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Complete(LearningContent.Nadia, _c.Towel)).StatusCode);
        Assert.Empty(Query("SELECT Id FROM LessonProgress"));
    }

    [Fact]
    public async Task Completing_a_lesson_saves_it_once_audits_it_once_and_unlocks_the_next()
    {
        var first = await Complete(LearningContent.Nadia, _c.Strengths);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var done = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(_c.Values, done.GetProperty("nextLessonId").GetGuid());
        Assert.Equal("What Matters to You", done.GetProperty("nextLessonTitle").GetString());
        Assert.False(done.GetProperty("moduleCompleted").GetBoolean());
        Assert.Equal(HttpStatusCode.OK, (await Complete(LearningContent.Nadia, _c.Strengths)).StatusCode);
        Assert.Single(Query("SELECT Id FROM LessonProgress"));
        Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Completed' AND RecordType = 'LessonProgress'"), s => s.Contains("Your Strengths"));
        Assert.True((await Get(LearningContent.Nadia, $"/learning/lessons/{_c.Strengths}")).GetProperty("done").GetBoolean());
        Assert.Equal(1, (await Get(LearningContent.Nadia, "/learning/home")).GetProperty("completedLessons").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Values}")).StatusCode);
    }

    [Fact]
    public async Task Finishing_a_module_completes_it_and_unlocks_the_module_that_needs_it()
    {
        await Complete(LearningContent.Nadia, _c.Strengths);
        var last = await (await Complete(LearningContent.Nadia, _c.Values)).Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(last.GetProperty("moduleCompleted").GetBoolean());
        Assert.Equal(JsonValueKind.Null, last.GetProperty("nextLessonId").ValueKind);
        var track = await Get(LearningContent.Nadia, $"/learning/tracks/{_c.Leadership}");
        Assert.Equal(["done", "not-started"], track.GetProperty("modules").EnumerateArray().Select(m => m.GetProperty("status").GetString()));
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/modules/{_c.Serving}")).StatusCode);
        Assert.Equal(_c.Towel, (await Get(LearningContent.Nadia, "/learning/home")).GetProperty("next").GetProperty("lessonId").GetGuid());
    }

    [Fact]
    public async Task A_scripture_lesson_answers_its_passage_and_a_coding_lesson_cannot_be_completed_here()
    {
        Execute($"UPDATE Lessons SET Kind = 'Scripture', Passage = 'For even the Son of Man did not come to be served, but to serve.' WHERE upper(Id) = upper('{_c.Strengths}')");
        Execute($"UPDATE Lessons SET Kind = 'Coding' WHERE upper(Id) = upper('{_c.Values}')");

        var lesson = await Get(LearningContent.Nadia, $"/learning/lessons/{_c.Strengths}");
        Assert.Equal("Scripture", lesson.GetProperty("kind").GetString());
        Assert.Equal("For even the Son of Man did not come to be served, but to serve.", lesson.GetProperty("passage").GetString());

        await Complete(LearningContent.Nadia, _c.Strengths);
        Assert.Equal(HttpStatusCode.Conflict, (await Complete(LearningContent.Nadia, _c.Values)).StatusCode);
    }

    [Fact]
    public async Task Drafts_deleted_lessons_other_roles_Learning_off_and_another_organization_are_refused()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Circle}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Complete(LearningContent.Nadia, _c.Voice)).StatusCode);
        await _factory.ClientFor(LearningContent.Marisol).DeleteAsync($"/curriculum/lessons/{_c.Strengths}");
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Strengths}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Values}")).StatusCode);

        Assert.Equal("consent-required", (await (await _factory.ClientFor(Sofia).GetAsync($"/learning/lessons/{_c.Values}")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await Complete(Daniel, _c.Values)).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/lessons/{_c.Values}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Complete(Lucia, _c.Values)).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Values}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Complete(LearningContent.Nadia, _c.Values)).StatusCode);
    }

    private Task<HttpResponseMessage> Complete(Guid membership, Guid lesson) => _factory.ClientFor(membership).PostAsync($"/learning/lessons/{lesson}/complete", null);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
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
