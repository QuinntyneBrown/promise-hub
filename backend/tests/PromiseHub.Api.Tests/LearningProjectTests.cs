using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-070 criteria 4 and 5 (a coding project saved as a draft and submitted once to the mentor), L2-068 criteria 3 to 7.
public sealed class LearningProjectTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task A_project_starts_from_its_starter_code_and_keeps_a_saved_draft()
    {
        var project = await Get($"/learning/coding/{_c.Strengths}");
        Assert.Equal("Project", project.GetProperty("kind").GetString());
        Assert.Equal("<h1>Our event</h1>", project.GetProperty("code").GetString());
        Assert.Equal(JsonValueKind.Null, project.GetProperty("submission").ValueKind);

        var draft = await _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/coding/{_c.Strengths}/progress", new { code = "<h1>Harbourview Youth Night</h1>", checkedStepIds = Array.Empty<Guid>() });

        Assert.Equal(HttpStatusCode.OK, draft.StatusCode);
        Assert.False((await draft.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("done").GetBoolean());
        Assert.Equal("<h1>Harbourview Youth Night</h1>", (await Get($"/learning/coding/{_c.Strengths}")).GetProperty("code").GetString());
        Assert.Empty(Query("SELECT Id FROM LessonProgress"));
    }

    [Fact]
    public async Task Submitting_stores_her_code_and_note_as_submitted_completes_the_project_audits_it_and_cannot_be_repeated()
    {
        var submitted = await Submit(_c.Strengths, "<h1>Harbourview Youth Night</h1>", "I used my first bit of CSS.");

        Assert.Equal(HttpStatusCode.Created, submitted.StatusCode);
        var project = await Get($"/learning/coding/{_c.Strengths}");
        Assert.True(project.GetProperty("done").GetBoolean());
        var submission = project.GetProperty("submission");
        Assert.Equal("Submitted", submission.GetProperty("status").GetString());
        Assert.Equal("I used my first bit of CSS.", submission.GetProperty("note").GetString());
        Assert.Equal("<h1>Harbourview Youth Night</h1>", project.GetProperty("code").GetString());
        Assert.Single(Query("SELECT Status FROM ProjectSubmissions"), s => s == "Submitted");
        Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'ProjectSubmission'"), s => s.Contains("Your Strengths"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Completed' AND RecordType = 'LessonProgress'"));
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Values}")).StatusCode);

        Assert.Equal(HttpStatusCode.Conflict, (await Submit(_c.Strengths, "<h1>Again</h1>", null)).StatusCode);
        Assert.Single(Query("SELECT Id FROM ProjectSubmissions"));
    }

    [Fact]
    public async Task Empty_code_too_much_code_and_a_long_note_are_refused()
    {
        Assert.Equal("Write some code before you submit.", await Error(await Submit(_c.Strengths, " ", null), "code"));
        Assert.Equal("Keep your code under 50,000 characters.", await Error(await Submit(_c.Strengths, new string('x', 50001), null), "code"));
        Assert.Equal("Keep the note under 1,000 characters.", await Error(await Submit(_c.Strengths, "<p>Hi</p>", new string('n', 1001)), "note"));
        Assert.Empty(Query("SELECT Id FROM ProjectSubmissions"));
    }

    [Fact]
    public async Task Only_an_open_project_of_her_own_organization_takes_a_submission()
    {
        Execute($"UPDATE Lessons SET Kind = 'Project' WHERE upper(Id) = upper('{_c.Values}')");
        Assert.Equal(HttpStatusCode.Forbidden, (await Submit(_c.Values, "<p>Hi</p>", null)).StatusCode);
        Execute($"UPDATE Lessons SET Kind = 'Coding' WHERE upper(Id) = upper('{_c.Strengths}')");
        Assert.Equal(HttpStatusCode.NotFound, (await Submit(_c.Strengths, "<p>Hi</p>", null)).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).PostAsJsonAsync($"/learning/coding/{_c.Values}/submission", new { code = "<p>x</p>" })).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await Submit(_c.Values, "<p>Hi</p>", null)).StatusCode);
    }

    private Task<HttpResponseMessage> Submit(Guid lesson, string code, string? note) =>
        _factory.ClientFor(LearningContent.Nadia).PostAsJsonAsync($"/learning/coding/{lesson}/submission", new { code, note });

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

    public async Task InitializeAsync()
    {
        _c = await new LearningContent(_factory).BuildAsync();
        Execute($"UPDATE Lessons SET Kind = 'Project', StarterCode = '<h1>Our event</h1>' WHERE upper(Id) = upper('{_c.Strengths}')");
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
