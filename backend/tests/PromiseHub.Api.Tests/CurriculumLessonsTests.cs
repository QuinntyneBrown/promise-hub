using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-067 criteria 1 to 6 and 9 (lessons: content, order, publish, soft delete), L2-066 criterion 6 (module and track status).
public sealed class CurriculumLessonsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_new_lesson_is_a_draft_placed_last_counted_in_its_module_and_audited()
    {
        var (_, module) = await Module();
        await CreateLesson(module, "Pick Up the Towel");
        var second = await CreateLesson(module, "Last in Line");

        var detail = await Get(Marisol, $"/curriculum/modules/{module}");
        var lessons = detail.GetProperty("lessons").EnumerateArray().ToList();
        Assert.Equal(["Pick Up the Towel", "Last in Line"], lessons.Select(l => l.GetProperty("title").GetString()));
        Assert.All(lessons, l => Assert.Equal("Draft", l.GetProperty("status").GetString()));
        Assert.Equal(second, lessons[1].GetProperty("id").GetGuid());
        var listed = (await Get(Marisol, "/curriculum")).GetProperty("tracks")[0].GetProperty("modules")[0];
        Assert.Equal(2, listed.GetProperty("lessonCount").GetInt32());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Lesson'"), s => s.Contains("Pick Up the Towel"));

        Assert.Equal("Give the lesson a title.", await Error(await Post(Marisol, "/curriculum/lessons", new { moduleId = module, title = " " }), "title"));
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, "/curriculum/lessons", new { moduleId = Guid.NewGuid(), title = "Lost" })).StatusCode);
    }

    [Fact]
    public async Task A_lesson_is_saved_with_every_field_returned_as_saved_and_audited()
    {
        var (_, module) = await Module();
        var lesson = await CreateLesson(module, "Pick Up the Towel");

        var saved = await Put(Marisol, $"/curriculum/lessons/{lesson}", Fields("Pick Up the Towel", 12, "Leading isn’t a title."));

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var read = await Get(Marisol, $"/curriculum/lessons/{lesson}");
        Assert.Equal("The captain and the kit bags", read.GetProperty("reading").GetString());
        Assert.Equal(12, read.GetProperty("minutes").GetInt32());
        Assert.Equal(["Notice what needs doing", "Serve without being asked"], read.GetProperty("objectives").EnumerateArray().Select(o => o.GetString()));
        Assert.Equal("Leading isn’t a title.", read.GetProperty("body").GetString());
        Assert.Equal(["Who picked up the towel for you?"], read.GetProperty("prompts").EnumerateArray().Select(o => o.GetString()));
        Assert.Equal("Watch for youth who find it hard to accept help.", read.GetProperty("leaderNotes").GetString());
        Assert.Equal("Leading by Serving", read.GetProperty("moduleTitle").GetString());
        Assert.Equal("Leadership Foundations", read.GetProperty("trackName").GetString());
        Assert.Equal(1, read.GetProperty("position").GetInt32());
        Assert.Equal(1, read.GetProperty("lessonCount").GetInt32());
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Lesson'"), a => a.Contains("kit bags"));
    }

    [Fact]
    public async Task A_lesson_is_refused_without_a_title_with_minutes_out_of_range_too_long_a_body_or_too_many_lines()
    {
        var (_, module) = await Module();
        var lesson = await CreateLesson(module, "Pick Up the Towel");

        Assert.Equal("Give the lesson a title.", await Error(await Put(Marisol, $"/curriculum/lessons/{lesson}", Fields("", 12, "Body")), "title"));
        Assert.Equal("Estimate between 1 and 600 minutes.", await Error(await Put(Marisol, $"/curriculum/lessons/{lesson}", Fields("Towel", 0, "Body")), "minutes"));
        Assert.Equal("Estimate between 1 and 600 minutes.", await Error(await Put(Marisol, $"/curriculum/lessons/{lesson}", Fields("Towel", 601, "Body")), "minutes"));
        Assert.Equal("Keep the teaching content under 20,000 characters.", await Error(await Put(Marisol, $"/curriculum/lessons/{lesson}", Fields("Towel", 12, new string('x', 20001))), "body"));
        var tooMany = new { title = "Towel", objectives = Enumerable.Range(1, 11).Select(i => $"Objective {i}").ToArray() };
        Assert.Equal("Keep it to 10 lines.", await Error(await Put(Marisol, $"/curriculum/lessons/{lesson}", tooMany), "objectives"));
        Assert.Equal("Pick Up the Towel", (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("title").GetString());
    }

    [Fact]
    public async Task Lessons_are_reordered_as_a_whole_list()
    {
        var (_, module) = await Module();
        var towel = await CreateLesson(module, "Pick Up the Towel");
        var line = await CreateLesson(module, "Last in Line");
        var coach = await CreateLesson(module, "Leading Like a Coach");

        Assert.Equal(HttpStatusCode.NoContent, (await Put(Marisol, $"/curriculum/modules/{module}/lesson-order", new { lessonIds = new[] { coach, towel, line } })).StatusCode);

        var titles = (await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("lessons").EnumerateArray().Select(l => l.GetProperty("title").GetString());
        Assert.Equal(["Leading Like a Coach", "Pick Up the Towel", "Last in Line"], titles);
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'CurriculumModule'"), s => s.Contains("Lesson order"));
        Assert.Equal("Send every lesson of the module once.", await Error(await Put(Marisol, $"/curriculum/modules/{module}/lesson-order", new { lessonIds = new[] { coach } }), "lessonIds"));
    }

    [Fact]
    public async Task A_lesson_publishes_only_with_teaching_content_and_goes_back_to_draft_audited()
    {
        var (_, module) = await Module();
        var lesson = await CreateLesson(module, "Pick Up the Towel");

        Assert.Equal("Add teaching content before publishing.", await Error(await Status($"/curriculum/lessons/{lesson}/status", "Published"), "status"));

        await Put(Marisol, $"/curriculum/lessons/{lesson}", Fields("Pick Up the Towel", 12, "Leading isn’t a title."));
        Assert.Equal(HttpStatusCode.NoContent, (await Status($"/curriculum/lessons/{lesson}/status", "Published")).StatusCode);
        Assert.Equal("Published", (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("status").GetString());
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Lesson'"), a => a.Contains("Published"));

        Assert.Equal(HttpStatusCode.NoContent, (await Status($"/curriculum/lessons/{lesson}/status", "Draft")).StatusCode);
        Assert.Equal("Draft", (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("status").GetString());
        Assert.Equal("Choose Draft or Published.", await Error(await Status($"/curriculum/lessons/{lesson}/status", "InReview"), "status"));
    }

    [Fact]
    public async Task A_module_goes_to_review_and_publishes_only_with_a_lesson_and_a_track_is_draft_or_published()
    {
        var (track, module) = await Module();

        Assert.Equal("Add a lesson before publishing the module.", await Error(await Status($"/curriculum/modules/{module}/status", "Published"), "status"));
        Assert.Equal(HttpStatusCode.NoContent, (await Status($"/curriculum/modules/{module}/status", "InReview")).StatusCode);
        Assert.Equal("InReview", (await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("status").GetString());

        await CreateLesson(module, "Pick Up the Towel");
        Assert.Equal(HttpStatusCode.NoContent, (await Status($"/curriculum/modules/{module}/status", "Published")).StatusCode);
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'CurriculumModule'"), a => a.Contains("Published"));

        Assert.Equal(HttpStatusCode.NoContent, (await Status($"/curriculum/tracks/{track}/status", "Published")).StatusCode);
        Assert.Equal("Published", (await Get(Marisol, "/curriculum")).GetProperty("tracks")[0].GetProperty("status").GetString());
        Assert.Equal("Choose Draft or Published.", await Error(await Status($"/curriculum/tracks/{track}/status", "InReview"), "status"));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Status($"/curriculum/tracks/{track}/status", "Archived")).StatusCode);
    }

    [Fact]
    public async Task Deleting_a_lesson_hides_it_everywhere_keeps_the_row_closes_the_order_and_is_audited()
    {
        var (_, module) = await Module();
        var towel = await CreateLesson(module, "Pick Up the Towel");
        var line = await CreateLesson(module, "Last in Line");

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/lessons/{towel}")).StatusCode);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/curriculum/lessons/{towel}")).StatusCode);
        var lessons = (await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("lessons").EnumerateArray().ToList();
        Assert.Equal(line, Assert.Single(lessons).GetProperty("id").GetGuid());
        Assert.Equal(1, (await Get(Marisol, $"/curriculum/lessons/{line}")).GetProperty("position").GetInt32());
        Assert.Equal(1, (await Get(Marisol, "/curriculum")).GetProperty("tracks")[0].GetProperty("modules")[0].GetProperty("lessonCount").GetInt32());
        Assert.Single(Query($"SELECT Title FROM Lessons WHERE upper(Id) = upper('{towel}') AND DeletedAt IS NOT NULL"));
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'Lesson'"), s => s.Contains("Pick Up the Towel"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/lessons/{towel}")).StatusCode);
    }

    [Fact]
    public async Task Leader_notes_and_drafts_stay_with_authors_and_other_roles_are_refused()
    {
        var (_, module) = await Module();
        var lesson = await CreateLesson(module, "Pick Up the Towel");

        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).GetAsync($"/curriculum/lessons/{lesson}")).StatusCode);
        foreach (var who in new[] { Jaylen, Sofia, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/curriculum/lessons/{lesson}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Put(who, $"/curriculum/lessons/{lesson}", Fields("Taken", 5, "Body"))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).DeleteAsync($"/curriculum/lessons/{lesson}")).StatusCode);
        }
    }

    [Fact]
    public async Task With_Learning_off_lesson_endpoints_answer_404_and_another_organization_gets_404()
    {
        var (_, module) = await Module();
        var lesson = await CreateLesson(module, "Pick Up the Towel");
        var northgate = await ModulesOn(Grace);
        await Put(Grace, "/settings/modules", new { on = northgate.Append("Learning").ToArray() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/curriculum/lessons/{lesson}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Grace, $"/curriculum/lessons/{lesson}", Fields("Taken", 5, "Body"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, "/curriculum/lessons", new { moduleId = module, title = "Into Harbourview" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Status($"/curriculum/lessons/{lesson}/status", "Draft", Grace)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/curriculum/lessons/{lesson}")).StatusCode);

        var on = await ModulesOn(Tom);
        await Put(Tom, "/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/curriculum/lessons/{lesson}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Status($"/curriculum/modules/{module}/status", "InReview")).StatusCode);
    }

    private static object Fields(string title, int? minutes, string body) => new
    {
        title,
        reading = "The captain and the kit bags",
        minutes,
        objectives = new[] { "Notice what needs doing", "Serve without being asked" },
        body,
        prompts = new[] { "Who picked up the towel for you?" },
        leaderNotes = "Watch for youth who find it hard to accept help.",
    };

    private async Task<(Guid Track, Guid Module)> Module()
    {
        var track = await Created(await Post(Marisol, "/curriculum/tracks", new { name = "Leadership Foundations" }));
        var module = await Created(await Post(Marisol, "/curriculum/modules", new { trackId = track, title = "Leading by Serving" }));
        return (track, module);
    }

    private async Task<Guid> CreateLesson(Guid moduleId, string title) =>
        await Created(await Post(Marisol, "/curriculum/lessons", new { moduleId, title }));

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private Task<HttpResponseMessage> Status(string path, string status, Guid? who = null) => Put(who ?? Marisol, path, new { status });

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
