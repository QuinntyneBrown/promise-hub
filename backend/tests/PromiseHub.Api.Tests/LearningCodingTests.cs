using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-070 criteria 1, 3 and 5 (coding lessons: steps, saved code and ticks, completion by checklist), L2-068 criteria 3 to 7.
public sealed class LearningCodingTests : IAsyncLifetime
{
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Skeleton = Guid.NewGuid();
    private static readonly Guid Heading = Guid.NewGuid();
    private static readonly Guid Run = Guid.NewGuid();
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task A_coding_lesson_answers_its_steps_in_order_and_the_starter_code_until_she_saves_her_own()
    {
        var lesson = await Get($"/learning/coding/{_c.Strengths}");

        Assert.Equal("Coding", lesson.GetProperty("kind").GetString());
        Assert.Equal("Your Strengths", lesson.GetProperty("title").GetString());
        var steps = lesson.GetProperty("steps").EnumerateArray().ToList();
        Assert.Equal(["Every page has a skeleton", "Add a heading and a paragraph", "Make it yours"], steps.Select(s => s.GetProperty("title").GetString()));
        Assert.Equal("<h1>Hello!</h1>", steps[0].GetProperty("sample").GetString());
        Assert.Equal("I know what an HTML tag is", steps[0].GetProperty("checkLabel").GetString());
        Assert.Equal("<h1>Change me</h1>", lesson.GetProperty("code").GetString());
        Assert.Empty(lesson.GetProperty("checkedStepIds").EnumerateArray());
        Assert.False(lesson.GetProperty("done").GetBoolean());
        Assert.False(lesson.TryGetProperty("leaderNotes", out _));
    }

    [Fact]
    public async Task Saving_keeps_her_code_and_ticks_and_ticking_every_item_completes_the_lesson_once()
    {
        var partial = await Save(_c.Strengths, "<h1>Harbourview Youth Night</h1>", Skeleton, Heading);
        Assert.Equal(HttpStatusCode.OK, partial.StatusCode);
        var saved = await partial.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, saved.GetProperty("checked").GetInt32());
        Assert.Equal(3, saved.GetProperty("total").GetInt32());
        Assert.False(saved.GetProperty("done").GetBoolean());
        var reread = await Get($"/learning/coding/{_c.Strengths}");
        Assert.Equal("<h1>Harbourview Youth Night</h1>", reread.GetProperty("code").GetString());
        Assert.Equal([Skeleton, Heading], reread.GetProperty("checkedStepIds").EnumerateArray().Select(i => i.GetGuid()));
        Assert.Empty(Query("SELECT Id FROM LessonProgress"));

        var all = await (await Save(_c.Strengths, "<h1>Harbourview Youth Night</h1>", Skeleton, Heading, Run)).Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(all.GetProperty("done").GetBoolean());
        Assert.Equal(_c.Values, all.GetProperty("nextLessonId").GetGuid());
        await Save(_c.Strengths, "<h1>Again</h1>", Skeleton, Heading, Run);
        Assert.Single(Query("SELECT Id FROM LessonProgress"));
        Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Completed' AND RecordType = 'LessonProgress'"));
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Values}")).StatusCode);
    }

    [Fact]
    public async Task Too_much_code_and_a_tick_from_another_lesson_are_refused()
    {
        Assert.Equal("Keep your code under 50,000 characters.", await Error(await Save(_c.Strengths, new string('x', 50001)), "code"));
        Assert.Equal("Tick only items of this checklist.", await Error(await Save(_c.Strengths, "<p>Hi</p>", Guid.NewGuid()), "checkedStepIds"));
        Assert.Empty(Query("SELECT Id FROM CodingWorkspaces"));
    }

    [Fact]
    public async Task A_reading_lesson_has_no_coding_page_and_a_locked_coding_lesson_is_refused()
    {
        Execute($"UPDATE Lessons SET Kind = 'Reading' WHERE upper(Id) = upper('{_c.Strengths}')");
        Execute($"UPDATE Lessons SET Kind = 'Coding' WHERE upper(Id) = upper('{_c.Values}')");

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/coding/{_c.Strengths}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(_c.Strengths, "<p>Hi</p>")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/coding/{_c.Values}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(_c.Values, "<p>Hi</p>")).StatusCode);
    }

    [Fact]
    public async Task Other_roles_another_organization_and_Learning_off_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/learning/coding/{_c.Strengths}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).PutAsJsonAsync($"/learning/coding/{_c.Strengths}/progress", new { code = "<p>x</p>", checkedStepIds = Array.Empty<Guid>() })).StatusCode);
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/coding/{_c.Strengths}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).PutAsJsonAsync($"/learning/coding/{_c.Strengths}/progress", new { code = "<p>x</p>", checkedStepIds = Array.Empty<Guid>() })).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/coding/{_c.Strengths}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(_c.Strengths, "<p>x</p>")).StatusCode);
    }

    private Task<HttpResponseMessage> Save(Guid lesson, string code, params Guid[] ticks) =>
        _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/coding/{lesson}/progress", new { code, checkedStepIds = ticks });

    private static async Task<string?> Error(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString();
    }

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
        command.ExecuteNonQuery();
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

    private void Step(Guid id, int position, string title, string? sample, string check) =>
        Execute($"INSERT INTO CodingSteps (Id, OrganizationId, LessonId, Position, Title, Instructions, Sample, CheckLabel) VALUES " +
                $"('{id.ToString().ToUpperInvariant()}', '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}', '{_c.Strengths.ToString().ToUpperInvariant()}', {position}, '{title}', 'Follow along.', {(sample is null ? "NULL" : $"'{sample}'")}, '{check}')");

    public async Task InitializeAsync()
    {
        _c = await new LearningContent(_factory).BuildAsync();
        Execute($"UPDATE Lessons SET Kind = 'Coding', StarterCode = '<h1>Change me</h1>' WHERE upper(Id) = upper('{_c.Strengths}')");
        Step(Run, 3, "Make it yours", null, "I edited the page and ran it");
        Step(Skeleton, 1, "Every page has a skeleton", "<h1>Hello!</h1>", "I know what an HTML tag is");
        Step(Heading, 2, "Add a heading and a paragraph", "<p>Come build.</p>", "I added a heading and a paragraph");
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
