using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-066 criterion 7 (the cohorts that follow a track), criteria 8 and 9 for it; L2-012 (a cohort is a program).
public sealed class CurriculumCohortsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");
    private static readonly Guid SummerCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Summer Camp 2026");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_curriculum_lists_the_active_programs_with_the_track_each_follows()
    {
        var leadership = await Track("Leadership Foundations");

        var curriculum = await Get(Marisol, "/curriculum");

        var programs = curriculum.GetProperty("programs").EnumerateArray().ToList();
        Assert.Equal(["After-School Tutoring", "Saturday Sports", "Winter Camp 2026"], programs.Select(p => p.GetProperty("name").GetString()));
        Assert.All(programs, p => Assert.Equal(JsonValueKind.Null, p.GetProperty("trackId").ValueKind));
        Assert.Empty(TrackIn(curriculum, leadership).GetProperty("followedBy").EnumerateArray());
    }

    [Fact]
    public async Task Choosing_cohorts_links_them_moves_them_from_another_track_unlinks_the_rest_and_is_audited()
    {
        var leadership = await Track("Leadership Foundations");
        var digital = await Track("Digital Skills");
        await Cohorts(digital, WinterCamp, Sports);

        var saved = await Cohorts(leadership, Tutoring, Sports);

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var curriculum = await Get(Marisol, "/curriculum");
        Assert.Equal(["After-School Tutoring", "Saturday Sports"], Names(TrackIn(curriculum, leadership)));
        Assert.Equal(["Winter Camp 2026"], Names(TrackIn(curriculum, digital)));
        var tutoring = curriculum.GetProperty("programs").EnumerateArray().Single(p => p.GetProperty("id").GetGuid() == Tutoring);
        Assert.Equal(leadership, tutoring.GetProperty("trackId").GetGuid());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Track'"), s => s.Contains("Cohorts · Leadership Foundations"));

        await Cohorts(leadership, Sports);
        Assert.Equal(["Saturday Sports"], Names(TrackIn(await Get(Marisol, "/curriculum"), leadership)));
        Assert.Equal(HttpStatusCode.NoContent, (await Cohorts(leadership)).StatusCode);
        Assert.Empty(Names(TrackIn(await Get(Marisol, "/curriculum"), leadership)));
    }

    [Fact]
    public async Task The_module_and_lesson_editors_name_the_programs_that_follow_the_track()
    {
        var leadership = await Track("Leadership Foundations");
        var module = await Created(await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/modules", new { trackId = leadership, title = "Leading by Serving" }));
        var lesson = await Created(await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/lessons", new { moduleId = module, title = "Pick Up the Towel" }));
        await Cohorts(leadership, Tutoring, Sports);

        Assert.Equal(["After-School Tutoring", "Saturday Sports"],
            (await Get(Marisol, $"/curriculum/modules/{module}")).GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
        Assert.Equal(["After-School Tutoring", "Saturday Sports"],
            (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
    }

    [Fact]
    public async Task An_archived_program_or_another_organizations_is_refused_and_nothing_changes()
    {
        var leadership = await Track("Leadership Foundations");
        await Cohorts(leadership, Tutoring);

        Assert.Equal("Choose active programs of your organization.", await Error(await Cohorts(leadership, Sports, SummerCamp)));
        Assert.Equal("Choose active programs of your organization.", await Error(await Cohorts(leadership, KidsClub)));
        Assert.Equal("Choose active programs of your organization.", await Error(await Cohorts(leadership, Tutoring, Tutoring)));
        Assert.Equal(["After-School Tutoring"], Names(TrackIn(await Get(Marisol, "/curriculum"), leadership)));
    }

    [Fact]
    public async Task Other_roles_are_refused_and_Learning_off_or_another_organization_answers_404()
    {
        var leadership = await Track("Leadership Foundations");

        Assert.Equal(HttpStatusCode.Forbidden, (await Cohorts(leadership, [Tutoring], Jaylen)).StatusCode);
        var northgate = await ModulesOn(Grace);
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = northgate.Append("Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await Cohorts(leadership, [KidsClub], Grace)).StatusCode);
        Assert.DoesNotContain((await Get(Grace, "/curriculum")).GetProperty("programs").EnumerateArray(), p => p.GetProperty("id").GetGuid() == Tutoring);

        var on = await ModulesOn(Tom);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await Cohorts(leadership, Tutoring)).StatusCode);
    }

    private async Task<Guid> Track(string name) =>
        await Created(await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/tracks", new { name }));

    private Task<HttpResponseMessage> Cohorts(Guid track, params Guid[] programIds) => Cohorts(track, programIds, Marisol);

    private Task<HttpResponseMessage> Cohorts(Guid track, Guid[] programIds, Guid who) =>
        _factory.ClientFor(who).PutAsJsonAsync($"/curriculum/tracks/{track}/cohorts", new { programIds });

    private static JsonElement TrackIn(JsonElement curriculum, Guid id) =>
        curriculum.GetProperty("tracks").EnumerateArray().Single(t => t.GetProperty("id").GetGuid() == id);

    private static List<string?> Names(JsonElement track) =>
        track.GetProperty("followedBy").EnumerateArray().Select(p => p.GetProperty("name").GetString()).ToList();

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<string[]> ModulesOn(Guid admin) =>
        (await Get(admin, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).ToArray();

    private static async Task<string?> Error(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("programIds").GetString();
    }

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
