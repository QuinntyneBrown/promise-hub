using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-084 criteria 1 to 6 (badges: list, create, update, refuse, delete, roles, tenants and the Learning gate).
public sealed class CurriculumBadgesTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid ServesOthers = DatabaseSeeder.CompetencyId(DatabaseSeeder.Harbourview, "Serves others");
    private static readonly Guid NorthgateKindness = DatabaseSeeder.CompetencyId(DatabaseSeeder.Northgate, "Shows kindness");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_new_automatic_badge_is_listed_with_its_rule_target_and_competency_and_audited()
    {
        var (module, lesson) = await Module();

        var id = await Created(await Post(Marisol, "/curriculum/badges", Badge(" Servant Heart ", "heart", "Finished Leading by Serving.", "Automatic", "ModuleCompleted", module, ServesOthers)));
        await Created(await Post(Marisol, "/curriculum/badges", Badge("Speaks Up", "flag", null, "Manual", "LessonCompleted", lesson, null)));

        var list = await Get(Marisol, "/curriculum/badges");
        var badges = list.GetProperty("badges").EnumerateArray().ToList();
        Assert.Equal(["Servant Heart", "Speaks Up"], badges.Select(b => b.GetProperty("name").GetString()));
        Assert.Equal("Automatic", badges[0].GetProperty("kind").GetString());
        Assert.Equal("ModuleCompleted", badges[0].GetProperty("rule").GetString());
        Assert.Equal("Leading by Serving", badges[0].GetProperty("targetTitle").GetString());
        Assert.Equal("Serves others", badges[0].GetProperty("competencyName").GetString());
        Assert.Equal(0, badges[0].GetProperty("earnedCount").GetInt32());
        Assert.Equal("Manual", badges[1].GetProperty("kind").GetString());
        Assert.Equal(JsonValueKind.Null, badges[1].GetProperty("rule").ValueKind);
        Assert.Equal(JsonValueKind.Null, badges[1].GetProperty("targetId").ValueKind);
        Assert.Equal(0, list.GetProperty("awards").GetInt32());

        var read = await Get(Marisol, $"/curriculum/badges/{id}");
        Assert.Equal("Servant Heart", read.GetProperty("name").GetString());
        Assert.Equal("heart", read.GetProperty("icon").GetString());
        Assert.Equal("Finished Leading by Serving.", read.GetProperty("description").GetString());
        Assert.Equal(module, read.GetProperty("targetId").GetGuid());
        Assert.Equal(ServesOthers, read.GetProperty("competencyId").GetGuid());
        Assert.Empty(read.GetProperty("awards").EnumerateArray());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Badge'"), s => s.Contains("Servant Heart"));
    }

    [Fact]
    public async Task The_options_name_the_lessons_modules_quizzes_assignments_and_competencies_to_choose_from()
    {
        var (module, lesson) = await Module();
        var quiz = await Created(await Post(Marisol, "/curriculum/quizzes", new { moduleId = module, title = "Leading by Serving quiz" }));
        var assignment = await Created(await Post(Marisol, "/curriculum/assignments", new { moduleId = module, title = "Serve someone this week" }));

        var options = await Get(Marisol, "/curriculum/badges/options");

        Assert.Equal(lesson, options.GetProperty("lessons")[0].GetProperty("id").GetGuid());
        Assert.Equal("Leading by Serving · Pick Up the Towel", options.GetProperty("lessons")[0].GetProperty("title").GetString());
        Assert.Equal("Leadership Foundations · Leading by Serving", options.GetProperty("modules")[0].GetProperty("title").GetString());
        Assert.Equal(quiz, options.GetProperty("quizzes")[0].GetProperty("id").GetGuid());
        Assert.Equal(assignment, options.GetProperty("assignments")[0].GetProperty("id").GetGuid());
        Assert.Equal(["Serves others", "Speaks up", "Leads a small group", "Follows through", "Works with others"],
            options.GetProperty("competencies").EnumerateArray().Select(c => c.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task A_badge_is_updated_and_audited_with_before_and_after()
    {
        var (module, lesson) = await Module();
        var id = await Created(await Post(Marisol, "/curriculum/badges", Badge("First Steps", "star", null, "Automatic", "LessonCompleted", lesson, null)));

        Assert.Equal(HttpStatusCode.NoContent, (await Put(Marisol, $"/curriculum/badges/{id}", Badge("First Steps Taken", "award", "Finished a first lesson.", "Manual", null, null, ServesOthers))).StatusCode);

        var read = await Get(Marisol, $"/curriculum/badges/{id}");
        Assert.Equal("First Steps Taken", read.GetProperty("name").GetString());
        Assert.Equal("award", read.GetProperty("icon").GetString());
        Assert.Equal("Manual", read.GetProperty("kind").GetString());
        Assert.Equal(JsonValueKind.Null, read.GetProperty("rule").ValueKind);
        Assert.Equal("Serves others", read.GetProperty("competencyName").GetString());
        var audit = Query("SELECT BeforeJson || ' -> ' || AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Badge'");
        Assert.Contains(audit, a => a.Contains("First Steps") && a.Contains("First Steps Taken") && a.Contains("LessonCompleted"));
        _ = module;
    }

    [Fact]
    public async Task A_badge_is_refused_when_its_fields_rule_target_or_competency_do_not_fit_and_nothing_is_saved()
    {
        var (module, lesson) = await Module();

        Assert.Equal("Give the badge a name.", await Error(await Post(Marisol, "/curriculum/badges", Badge(" ", "star", null, "Manual", null, null, null)), "name"));
        Assert.Equal("Keep the name under 60 characters.", await Error(await Post(Marisol, "/curriculum/badges", Badge(new string('b', 61), "star", null, "Manual", null, null, null)), "name"));
        Assert.Equal("Keep the description under 200 characters.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", new string('d', 201), "Manual", null, null, null)), "description"));
        Assert.Equal("Choose an icon.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "rocket", null, "Manual", null, null, null)), "icon"));
        Assert.Equal("Choose how it’s earned.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Sometimes", null, null, null)), "kind"));
        Assert.Equal("Choose a rule.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", null, null, null)), "rule"));
        Assert.Equal("Choose a rule.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "AttendanceStreak", null, null)), "rule"));
        Assert.Equal("Choose the module that earns it.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "ModuleCompleted", null, null)), "targetId"));
        Assert.Equal("Choose the module that earns it.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "ModuleCompleted", lesson, null)), "targetId"));
        Assert.Equal("Choose the lesson that earns it.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "LessonCompleted", module, null)), "targetId"));
        Assert.Equal("Choose the quiz that earns it.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "QuizPassed", module, null)), "targetId"));
        Assert.Equal("Choose the assignment that earns it.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "AssignmentAccepted", Guid.NewGuid(), null)), "targetId"));
        Assert.Equal("Choose a competency of the progression framework.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Manual", null, null, NorthgateKindness)), "competencyId"));
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/lessons/{lesson}")).StatusCode);
        Assert.Equal("Choose the lesson that earns it.", await Error(await Post(Marisol, "/curriculum/badges", Badge("B", "star", null, "Automatic", "LessonCompleted", lesson, null)), "targetId"));

        Assert.Empty((await Get(Marisol, "/curriculum/badges")).GetProperty("badges").EnumerateArray());
    }

    [Fact]
    public async Task A_deleted_badge_leaves_the_list_answers_404_and_is_audited()
    {
        var id = await Created(await Post(Marisol, "/curriculum/badges", Badge("Encourager", "sparkle", "Lifted someone up.", "Manual", null, null, null)));

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/badges/{id}")).StatusCode);

        Assert.Empty((await Get(Marisol, "/curriculum/badges")).GetProperty("badges").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/curriculum/badges/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Marisol, $"/curriculum/badges/{id}", Badge("Again", "star", null, "Manual", null, null, null))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/badges/{id}")).StatusCode);
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'Badge'"), s => s.Contains("Encourager"));
    }

    [Fact]
    public async Task Badges_are_refused_to_other_roles_other_organizations_and_with_Learning_off()
    {
        var id = await Created(await Post(Marisol, "/curriculum/badges", Badge("Encourager", "sparkle", null, "Manual", null, null, null)));
        foreach (var who in new[] { Jaylen, Sofia, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/curriculum/badges")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/curriculum/badges/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Post(who, "/curriculum/badges", Badge("Mine", "star", null, "Manual", null, null, null))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Put(who, $"/curriculum/badges/{id}", Badge("Mine", "star", null, "Manual", null, null, null))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).DeleteAsync($"/curriculum/badges/{id}")).StatusCode);
        }
        var northgate = await ModulesOn(Grace);
        await Put(Grace, "/settings/modules", new { on = northgate.Append("Learning").ToArray() });
        Assert.Empty((await Get(Grace, "/curriculum/badges")).GetProperty("badges").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/curriculum/badges/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Grace, $"/curriculum/badges/{id}", Badge("Taken", "star", null, "Manual", null, null, null))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/curriculum/badges/{id}")).StatusCode);
        var on = await ModulesOn(Tom);
        await Put(Tom, "/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/curriculum/badges")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/curriculum/badges/options")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, "/curriculum/badges", Badge("Off", "star", null, "Manual", null, null, null))).StatusCode);
    }

    private static object Badge(string name, string icon, string? description, string kind, string? rule, Guid? targetId, Guid? competencyId) =>
        new { name, icon, description, kind, rule, targetId, competencyId };

    private async Task<(Guid Module, Guid Lesson)> Module()
    {
        var track = await Created(await Post(Marisol, "/curriculum/tracks", new { name = "Leadership Foundations" }));
        var module = await Created(await Post(Marisol, "/curriculum/modules", new { trackId = track, title = "Leading by Serving" }));
        var lesson = await Created(await Post(Marisol, "/curriculum/lessons", new { moduleId = module, title = "Pick Up the Towel" }));
        return (module, lesson);
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
