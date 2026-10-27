using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-074 criteria 1 to 4, 6 and 7 (an assignment: task, ways to submit, rubric and total, due rules).
public sealed class CurriculumAssignmentsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    private const string Brief = "This week, put Pick Up the Towel into practice. Choose one person to serve without being asked.";

    [Fact]
    public async Task A_new_assignment_is_a_draft_accepting_text_listed_on_its_module_and_audited()
    {
        var (module, lesson, _) = await Module();

        var assignment = await Created(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, lessonId = lesson, title = " Serve someone this week " }));

        var read = await Get(Marisol, $"/curriculum/assignments/{assignment}");
        Assert.Equal("Serve someone this week", read.GetProperty("title").GetString());
        Assert.Equal("Draft", read.GetProperty("status").GetString());
        Assert.Equal(lesson, read.GetProperty("lessonId").GetGuid());
        Assert.Equal(["Text"], read.GetProperty("submissionTypes").EnumerateArray().Select(t => t.GetString()));
        Assert.Equal(JsonValueKind.Null, read.GetProperty("brief").ValueKind);
        Assert.Equal(JsonValueKind.Null, read.GetProperty("dueDate").ValueKind);
        Assert.Equal(0, read.GetProperty("graceDays").GetInt32());
        Assert.False(read.GetProperty("allowLate").GetBoolean());
        Assert.False(read.GetProperty("requireApproval").GetBoolean());
        Assert.Equal(0, read.GetProperty("totalPoints").GetInt32());
        Assert.Empty(read.GetProperty("rubric").EnumerateArray());
        Assert.Equal("Leading by Serving", read.GetProperty("moduleTitle").GetString());
        Assert.Equal(["Pick Up the Towel"], read.GetProperty("lessons").EnumerateArray().Select(l => l.GetProperty("title").GetString()));

        var listed = Assert.Single((await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("assignments").EnumerateArray());
        Assert.Equal("Serve someone this week", listed.GetProperty("title").GetString());
        Assert.Equal("Pick Up the Towel", listed.GetProperty("lessonTitle").GetString());
        Assert.Equal(0, listed.GetProperty("totalPoints").GetInt32());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Assignment'"), s => s.Contains("Serve someone this week"));

        Assert.Equal("Give the assignment a title.", await Error(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, title = "" }), "title"));
        Assert.Equal("Choose a lesson of this module.", await Error(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, lessonId = Guid.NewGuid(), title = "A" }), "lessonId"));
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, "/curriculum/assignments", new { moduleId = Guid.NewGuid(), title = "Lost" })).StatusCode);
    }

    [Fact]
    public async Task An_assignment_is_saved_with_its_rubric_in_order_and_the_total_computed_and_audited()
    {
        var (module, lesson, _) = await Module();
        var assignment = await Created(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, title = "Serve someone this week" }));

        var saved = await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(lessonId: lesson));

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var read = await Get(Marisol, $"/curriculum/assignments/{assignment}");
        Assert.Equal(Brief, read.GetProperty("brief").GetString());
        Assert.Equal(lesson, read.GetProperty("lessonId").GetGuid());
        Assert.Equal(["Text", "Photo"], read.GetProperty("submissionTypes").EnumerateArray().Select(t => t.GetString()));
        Assert.Equal(["Chose someone and served without being asked", "Described what they did and how it felt", "Named one thing they noticed"],
            read.GetProperty("rubric").EnumerateArray().Select(c => c.GetProperty("description").GetString()));
        Assert.Equal([10, 10, 5], read.GetProperty("rubric").EnumerateArray().Select(c => c.GetProperty("points").GetInt32()));
        Assert.Equal(25, read.GetProperty("totalPoints").GetInt32());
        Assert.Equal("2026-11-19", read.GetProperty("dueDate").GetString());
        Assert.Equal(2, read.GetProperty("graceDays").GetInt32());
        Assert.True(read.GetProperty("allowLate").GetBoolean());
        Assert.True(read.GetProperty("requireApproval").GetBoolean());
        Assert.Equal(25, Assert.Single((await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("assignments").EnumerateArray()).GetProperty("totalPoints").GetInt32());
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Assignment'"), a => a.Contains("Named one thing they noticed") && a.Contains("25"));

        Assert.Equal(HttpStatusCode.NoContent, (await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(rubric: [new { description = "Served someone", points = 20 }], dueDate: null))).StatusCode);
        var replaced = await Get(Marisol, $"/curriculum/assignments/{assignment}");
        Assert.Equal(20, replaced.GetProperty("totalPoints").GetInt32());
        Assert.Single(replaced.GetProperty("rubric").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, replaced.GetProperty("dueDate").ValueKind);
    }

    [Fact]
    public async Task An_assignment_is_refused_without_a_title_task_or_way_to_submit_with_a_bad_rubric_or_grace_and_nothing_changes()
    {
        var assignment = await Assignment();

        Assert.Equal("Give the assignment a title.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(title: " ")), "title"));
        Assert.Equal("Describe the task.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(brief: "")), "brief"));
        Assert.Equal("Keep the task under 5,000 characters.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(brief: new string('b', 5001))), "brief"));
        Assert.Equal("Choose at least one way to submit.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(types: [])), "submissionTypes"));
        Assert.Equal("Choose at least one way to submit.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(types: ["Video"])), "submissionTypes"));
        Assert.Equal("Give each criterion a description and 1 to 100 points.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(rubric: [new { description = " ", points = 5 }])), "rubric"));
        Assert.Equal("Give each criterion a description and 1 to 100 points.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(rubric: [new { description = "Served", points = 0 }])), "rubric"));
        Assert.Equal("Give each criterion a description and 1 to 100 points.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(rubric: [new { description = "Served", points = 101 }])), "rubric"));
        Assert.Equal("Give each criterion a description and 1 to 100 points.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(rubric: [new { description = new string('d', 201), points = 5 }])), "rubric"));
        Assert.Equal("Keep the rubric to 10 criteria.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(rubric: Enumerable.Range(1, 11).Select(i => (object)new { description = $"Criterion {i}", points = 1 }).ToArray())), "rubric"));
        Assert.Equal("Choose a grace period of up to 14 days.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(graceDays: 15)), "graceDays"));
        Assert.Equal("Choose a grace period of up to 14 days.", await Error(await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields(graceDays: -1)), "graceDays"));
        var read = await Get(Marisol, $"/curriculum/assignments/{assignment}");
        Assert.Equal(JsonValueKind.Null, read.GetProperty("brief").ValueKind);
        Assert.Empty(read.GetProperty("rubric").EnumerateArray());
    }

    [Fact]
    public async Task Assignments_are_refused_to_other_roles_other_organizations_and_with_Learning_off()
    {
        var (module, _, _) = await Module();
        var assignment = await Created(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, title = "Serve someone this week" }));

        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).GetAsync($"/curriculum/assignments/{assignment}")).StatusCode);
        foreach (var who in new[] { Jaylen, Sofia, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/curriculum/assignments/{assignment}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Post(who, "/curriculum/assignments", new { moduleId = module, title = "Taken" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Put(who, $"/curriculum/assignments/{assignment}", Fields())).StatusCode);
        }
        var northgate = await ModulesOn(Grace);
        await Put(Grace, "/settings/modules", new { on = northgate.Append("Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/curriculum/assignments/{assignment}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, "/curriculum/assignments", new { moduleId = module, title = "Into Harbourview" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Grace, $"/curriculum/assignments/{assignment}", Fields())).StatusCode);
        Assert.Equal(JsonValueKind.Null, (await Get(Marisol, $"/curriculum/assignments/{assignment}")).GetProperty("brief").ValueKind);

        var on = await ModulesOn(Tom);
        await Put(Tom, "/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/curriculum/assignments/{assignment}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Marisol, $"/curriculum/assignments/{assignment}", Fields())).StatusCode);
    }

    private static object Fields(string title = "Serve someone this week", Guid? lessonId = null, string brief = Brief, string[]? types = null,
        object[]? rubric = null, string? dueDate = "2026-11-19", int graceDays = 2) => new
        {
            title,
            lessonId,
            brief,
            submissionTypes = types ?? ["Text", "Photo"],
            rubric = rubric ??
            [
                new { description = "Chose someone and served without being asked", points = 10 },
                new { description = "Described what they did and how it felt", points = 10 },
                new { description = "Named one thing they noticed", points = 5 },
            ],
            dueDate,
            graceDays,
            allowLate = true,
            requireApproval = true,
        };

    private async Task<(Guid Module, Guid Lesson, Guid Track)> Module(string trackName = "Leadership Foundations")
    {
        var track = await Created(await Post(Marisol, "/curriculum/tracks", new { name = trackName }));
        var module = await Created(await Post(Marisol, "/curriculum/modules", new { trackId = track, title = "Leading by Serving" }));
        var lesson = await Created(await Post(Marisol, "/curriculum/lessons", new { moduleId = module, title = "Pick Up the Towel" }));
        return (module, lesson, track);
    }

    private async Task<Guid> Assignment()
    {
        var (module, _, _) = await Module();
        return await Created(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, title = "Serve someone this week" }));
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
