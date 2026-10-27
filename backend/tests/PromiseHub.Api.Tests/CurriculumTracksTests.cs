using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-066 criteria 1 to 5, 8, 9 (tracks and their ordered modules; module details), L2-007 criterion 12.
public sealed class CurriculumTracksTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_new_track_is_a_draft_with_a_key_made_from_its_name_and_is_listed_and_audited()
    {
        var created = await Post(Marisol, "/curriculum/tracks", new { name = "Digital Skills", key = "", description = "Using technology safely.", publish = false });

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var track = Track(await Get(Marisol, "/curriculum"), "Digital Skills");
        Assert.Equal("digital-skills", track.GetProperty("key").GetString());
        Assert.Equal("Draft", track.GetProperty("status").GetString());
        Assert.Equal("Using technology safely.", track.GetProperty("description").GetString());
        Assert.Empty(track.GetProperty("modules").EnumerateArray());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Track'"), s => s.Contains("Digital Skills"));
    }

    [Fact]
    public async Task Publish_now_creates_a_published_track()
    {
        await Post(Marisol, "/curriculum/tracks", new { name = "Leadership Foundations", key = "leadership", publish = true });

        var track = Track(await Get(Marisol, "/curriculum"), "Leadership Foundations");
        Assert.Equal("Published", track.GetProperty("status").GetString());
        Assert.Equal("leadership", track.GetProperty("key").GetString());
    }

    [Fact]
    public async Task A_track_is_refused_without_a_name_with_a_bad_key_or_a_key_already_used()
    {
        await Post(Marisol, "/curriculum/tracks", new { name = "Leadership Foundations", key = "leadership" });

        Assert.Equal("Give the track a name.", await Error(await Post(Marisol, "/curriculum/tracks", new { name = " " }), "name"));
        Assert.Equal("Keep the name under 80 characters.", await Error(await Post(Marisol, "/curriculum/tracks", new { name = new string('x', 81) }), "name"));
        Assert.Equal("Use lowercase letters, numbers and hyphens.", await Error(await Post(Marisol, "/curriculum/tracks", new { name = "Art", key = "Art Club!" }), "key"));
        Assert.Equal("Another track already uses this key.", await Error(await Post(Marisol, "/curriculum/tracks", new { name = "Leaders", key = "leadership" }), "key"));
        Assert.Single((await Get(Marisol, "/curriculum")).GetProperty("tracks").EnumerateArray());
    }

    [Fact]
    public async Task Modules_are_added_last_as_drafts_and_listed_in_order()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var first = await CreateModule(trackId, "Knowing Yourself");
        await CreateModule(trackId, "Leading by Serving");

        var track = Track(await Get(Marisol, "/curriculum"), "Leadership Foundations");
        var modules = track.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.All(modules, m => Assert.Equal("Draft", m.GetProperty("status").GetString()));
        Assert.All(modules, m => Assert.Equal(0, m.GetProperty("lessonCount").GetInt32()));
        Assert.Equal(first, modules[0].GetProperty("id").GetGuid());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'CurriculumModule'"), s => s.Contains("Knowing Yourself"));

        Assert.Equal("Give the module a name.", await Error(await Post(Marisol, "/curriculum/modules", new { trackId, title = "" }), "title"));
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, "/curriculum/modules", new { trackId = Guid.NewGuid(), title = "Lost" })).StatusCode);
    }

    [Fact]
    public async Task Reordering_saves_the_whole_order_and_refuses_a_list_that_is_not_every_module_once()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var knowing = await CreateModule(trackId, "Knowing Yourself");
        var serving = await CreateModule(trackId, "Leading by Serving");
        var speaking = await CreateModule(trackId, "Speaking Up");

        var moved = await Put(Marisol, $"/curriculum/tracks/{trackId}/module-order", new { moduleIds = new[] { knowing, speaking, serving } });

        Assert.Equal(HttpStatusCode.NoContent, moved.StatusCode);
        var titles = Track(await Get(Marisol, "/curriculum"), "Leadership Foundations").GetProperty("modules").EnumerateArray().Select(m => m.GetProperty("title").GetString());
        Assert.Equal(["Knowing Yourself", "Speaking Up", "Leading by Serving"], titles);
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Track'"), s => s.Contains("Module order"));

        var missing = await Put(Marisol, $"/curriculum/tracks/{trackId}/module-order", new { moduleIds = new[] { knowing, speaking } });
        Assert.Equal("Send every module of the track once.", await Error(missing, "moduleIds"));
        var twice = await Put(Marisol, $"/curriculum/tracks/{trackId}/module-order", new { moduleIds = new[] { knowing, knowing, serving } });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, twice.StatusCode);
    }

    [Fact]
    public async Task A_module_is_read_and_saved_with_its_prerequisite_and_anchor_and_audited()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var knowing = await CreateModule(trackId, "Knowing Yourself");
        var serving = await CreateModule(trackId, "Leading by Serving");

        var saved = await Put(Marisol, $"/curriculum/modules/{serving}", new
        {
            title = "Leading by Serving",
            description = "Putting others first.",
            prerequisiteModuleId = knowing,
            anchor = "The best leaders carry the bags.",
        });

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var module = await Get(Marisol, $"/curriculum/modules/{serving}");
        Assert.Equal("Putting others first.", module.GetProperty("description").GetString());
        Assert.Equal(knowing, module.GetProperty("prerequisiteModuleId").GetGuid());
        Assert.Equal("The best leaders carry the bags.", module.GetProperty("anchor").GetString());
        Assert.Equal("Leadership Foundations", module.GetProperty("trackName").GetString());
        Assert.Equal(2, module.GetProperty("position").GetInt32());
        Assert.Equal(2, module.GetProperty("moduleCount").GetInt32());
        Assert.Equal(["Knowing Yourself"], module.GetProperty("earlierModules").EnumerateArray().Select(m => m.GetProperty("title").GetString()));
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'CurriculumModule'"), a => a.Contains("Putting others first."));
    }

    [Fact]
    public async Task A_module_is_refused_without_a_name_or_with_a_prerequisite_that_does_not_come_before_it()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var knowing = await CreateModule(trackId, "Knowing Yourself");
        var serving = await CreateModule(trackId, "Leading by Serving");

        Assert.Equal("Give the module a name.", await Error(await Put(Marisol, $"/curriculum/modules/{serving}", new { title = "" }), "title"));
        Assert.Equal("Choose a module that comes before this one.",
            await Error(await Put(Marisol, $"/curriculum/modules/{knowing}", new { title = "Knowing Yourself", prerequisiteModuleId = serving }), "prerequisiteModuleId"));
        Assert.Equal("Choose a module that comes before this one.",
            await Error(await Put(Marisol, $"/curriculum/modules/{serving}", new { title = "Leading by Serving", prerequisiteModuleId = serving }), "prerequisiteModuleId"));
    }

    [Fact]
    public async Task Only_admins_and_program_directors_author_and_participants_are_refused()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var module = await CreateModule(trackId, "Knowing Yourself");

        Assert.Equal(HttpStatusCode.Created, (await Post(Tom, "/curriculum/tracks", new { name = "Admin track" })).StatusCode);
        foreach (var who in new[] { Jaylen, Sofia, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Post(who, "/curriculum/tracks", new { name = "Nope" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/curriculum/modules/{module}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Put(who, $"/curriculum/tracks/{trackId}/module-order", new { moduleIds = new[] { module } })).StatusCode);
        }
    }

    [Fact]
    public async Task With_Learning_off_every_curriculum_endpoint_answers_404_and_turning_it_on_restores_the_tracks()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var module = await CreateModule(trackId, "Knowing Yourself");
        var on = await ModulesOn(Tom);

        await Put(Tom, "/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/curriculum")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, "/curriculum/tracks", new { name = "Off" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/curriculum/modules/{module}")).StatusCode);

        await Put(Tom, "/settings/modules", new { on });
        Assert.Single((await Get(Marisol, "/curriculum")).GetProperty("tracks").EnumerateArray());
    }

    [Fact]
    public async Task Another_organizations_tracks_and_modules_are_never_returned_and_answer_404()
    {
        var trackId = await CreateTrack("Leadership Foundations");
        var module = await CreateModule(trackId, "Knowing Yourself");
        var northgate = await ModulesOn(Grace);
        await Put(Grace, "/settings/modules", new { on = northgate.Append("Learning").ToArray() });

        Assert.Empty((await Get(Grace, "/curriculum")).GetProperty("tracks").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/curriculum/modules/{module}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Grace, $"/curriculum/modules/{module}", new { title = "Taken" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, "/curriculum/modules", new { trackId, title = "Into Harbourview" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Put(Grace, $"/curriculum/tracks/{trackId}/module-order", new { moduleIds = new[] { module } })).StatusCode);
        Assert.Equal("Knowing Yourself", (await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("title").GetString());
    }

    private async Task<Guid> CreateTrack(string name)
    {
        var response = await Post(Marisol, "/curriculum/tracks", new { name });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<Guid> CreateModule(Guid trackId, string title)
    {
        var response = await Post(Marisol, "/curriculum/modules", new { trackId, title });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<string[]> ModulesOn(Guid admin) =>
        (await Get(admin, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).ToArray();

    private static JsonElement Track(JsonElement curriculum, string name) =>
        curriculum.GetProperty("tracks").EnumerateArray().Single(t => t.GetProperty("name").GetString() == name);

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
