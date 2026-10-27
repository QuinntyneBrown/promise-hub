using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-086 criteria 1 to 7 (the progression framework: seeded stages, add and edit a stage, the stage order,
// add and remove a competency that mentors assess, refusals, roles, tenants and the Learning gate), L2-082, L2-032.
public sealed class CurriculumProgressionTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task Each_organization_starts_with_its_seeded_stages_and_their_competencies()
    {
        var stages = (await Get(LearningContent.Marisol, "/curriculum/progression")).GetProperty("stages").EnumerateArray().ToList();

        Assert.Equal(["Explorer", "Contributor", "Leader"], stages.Select(s => s.GetProperty("name").GetString()));
        Assert.Equal([1, 2, 3], stages.Select(s => s.GetProperty("position").GetInt32()));
        Assert.Equal("Finding their place in the group", stages[0].GetProperty("description").GetString());
        Assert.Equal(["Serves others", "Works with others"], Names(stages[0]));
        Assert.Equal(["Speaks up", "Follows through"], Names(stages[1]));
        Assert.Equal(["Leads a small group"], Names(stages[2]));
        Assert.Equal("Notices what needs doing and helps without being asked.", stages[0].GetProperty("competencies")[0].GetProperty("description").GetString());

        await LearningOn(Grace);
        var northgate = (await Get(Grace, "/curriculum/progression")).GetProperty("stages").EnumerateArray().ToList();
        Assert.Equal(["Explorer", "Contributor"], northgate.Select(s => s.GetProperty("name").GetString()));
        Assert.Equal(["Shows kindness", "Tries new things"], Names(northgate[0]));
    }

    [Fact]
    public async Task A_stage_is_added_last_edited_and_audited_with_before_and_after()
    {
        var id = await Created(await Post("/curriculum/progression/stages", new { name = " Mentor ", description = "Helps a newer youth find their feet" }));

        var stages = await Stages();
        Assert.Equal("Mentor", stages[3].GetProperty("name").GetString());
        Assert.Equal(4, stages[3].GetProperty("position").GetInt32());
        Assert.Empty(stages[3].GetProperty("competencies").EnumerateArray());
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'ProgressionStage'"), s => s.Contains("Mentor"));

        Assert.Equal(HttpStatusCode.NoContent, (await Put($"/curriculum/progression/stages/{id}", new { name = "Guide", description = "" })).StatusCode);

        var edited = (await Stages())[3];
        Assert.Equal("Guide", edited.GetProperty("name").GetString());
        Assert.Equal("", edited.GetProperty("description").GetString());
        Assert.Contains(_w.Query("SELECT BeforeJson || ' -> ' || AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'ProgressionStage'"),
            a => a.Contains("Mentor") && a.Contains("Guide"));
    }

    [Fact]
    public async Task Stages_and_competencies_are_refused_when_their_names_or_descriptions_do_not_fit()
    {
        var explorer = (await Stages())[0].GetProperty("id").GetGuid();

        Assert.Equal("Give the stage a name.", await Error(await Post("/curriculum/progression/stages", new { name = " " }), "name"));
        Assert.Equal("Keep the name under 60 characters.", await Error(await Post("/curriculum/progression/stages", new { name = new string('s', 61) }), "name"));
        Assert.Equal("Keep the description under 200 characters.", await Error(await Post("/curriculum/progression/stages", new { name = "S", description = new string('d', 201) }), "description"));
        Assert.Equal("Give the stage a name.", await Error(await Put($"/curriculum/progression/stages/{explorer}", new { name = "" }), "name"));
        Assert.Equal("Name the competency.", await Error(await Post($"/curriculum/progression/stages/{explorer}/competencies", new { name = " " }), "name"));
        Assert.Equal("Keep the name under 80 characters.", await Error(await Post($"/curriculum/progression/stages/{explorer}/competencies", new { name = new string('c', 81) }), "name"));
        Assert.Equal("Keep the description under 300 characters.", await Error(await Post($"/curriculum/progression/stages/{explorer}/competencies", new { name = "C", description = new string('d', 301) }), "description"));

        var stages = await Stages();
        Assert.Equal(3, stages.Count);
        Assert.Equal("Explorer", stages[0].GetProperty("name").GetString());
        Assert.Equal(2, stages[0].GetProperty("competencies").GetArrayLength());
    }

    [Fact]
    public async Task The_stage_order_is_saved_as_a_whole_list_and_audited()
    {
        var ids = (await Stages()).Select(s => s.GetProperty("id").GetGuid()).ToList();

        Assert.Equal(HttpStatusCode.NoContent, (await Put("/curriculum/progression/stage-order", new { stageIds = new[] { ids[1], ids[0], ids[2] } })).StatusCode);

        Assert.Equal(["Contributor", "Explorer", "Leader"], (await Stages()).Select(s => s.GetProperty("name").GetString()));
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'ProgressionStage'"), s => s.Contains("Stage order"));
        Assert.Equal("Send every stage once.", await Error(await Put("/curriculum/progression/stage-order", new { stageIds = new[] { ids[0], ids[0], ids[2] } }), "stageIds"));
        Assert.Equal("Send every stage once.", await Error(await Put("/curriculum/progression/stage-order", new { stageIds = new[] { ids[0], ids[1] } }), "stageIds"));
    }

    [Fact]
    public async Task A_new_competency_joins_its_stage_and_the_mentors_sheet_last_and_a_removed_one_leaves_both_keeping_its_assessments()
    {
        var stages = await Stages();
        var explorer = stages[0].GetProperty("id").GetGuid();
        var works = stages[0].GetProperty("competencies")[1].GetProperty("id").GetGuid();
        var sheet = $"/mentoring/youth/{LearningContent.NadiaChild}/competencies";
        var before = (await Get(MentorReviewWork.Daniel, sheet)).GetProperty("items").EnumerateArray().Select(i => i.GetProperty("id").GetGuid()).ToList();
        await _factory.ClientFor(MentorReviewWork.Daniel).PutAsJsonAsync(sheet, new { items = before.Select(id => new { competencyId = id, level = id == works ? "Proficient" : "NotStarted", notes = (string?)null }).ToArray() });

        var added = await Created(await Post($"/curriculum/progression/stages/{explorer}/competencies", new { name = "Welcomes someone new", description = "Says hello, learns their name and includes them." }));

        Assert.Equal(["Serves others", "Works with others", "Welcomes someone new"], Names((await Stages())[0]));
        Assert.Equal("Welcomes someone new", (await Get(MentorReviewWork.Daniel, sheet)).GetProperty("items").EnumerateArray().Last().GetProperty("name").GetString());
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Competency'"), s => s.Contains("Welcomes someone new"));

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(LearningContent.Marisol).DeleteAsync($"/curriculum/progression/competencies/{works}")).StatusCode);

        Assert.Equal(["Serves others", "Welcomes someone new"], Names((await Stages())[0]));
        var items = (await Get(MentorReviewWork.Daniel, sheet)).GetProperty("items").EnumerateArray().ToList();
        Assert.DoesNotContain(items, i => i.GetProperty("id").GetGuid() == works);
        Assert.Equal(5, items.Count);
        var refused = await _factory.ClientFor(MentorReviewWork.Daniel).PutAsJsonAsync(sheet, new { items = new[] { new { competencyId = works, level = "Mastered", notes = (string?)null } } });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Single(_w.Query($"SELECT Id FROM CompetencyAssessments WHERE upper(CompetencyId) = upper('{works}')"));
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'Competency'"), s => s.Contains("Works with others"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).DeleteAsync($"/curriculum/progression/competencies/{works}")).StatusCode);
        _ = added;
    }

    [Fact]
    public async Task The_framework_is_refused_to_other_roles_other_organizations_and_with_Learning_off()
    {
        var stages = await Stages();
        var explorer = stages[0].GetProperty("id").GetGuid();
        var serves = stages[0].GetProperty("competencies")[0].GetProperty("id").GetGuid();
        var ids = stages.Select(s => s.GetProperty("id").GetGuid()).ToArray();
        foreach (var who in new[] { Jaylen, Sofia, MentorReviewWork.Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/curriculum/progression")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).PostAsJsonAsync("/curriculum/progression/stages", new { name = "Mine" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).DeleteAsync($"/curriculum/progression/competencies/{serves}")).StatusCode);
        }
        await LearningOn(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PutAsJsonAsync($"/curriculum/progression/stages/{explorer}", new { name = "Taken" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/curriculum/progression/stages/{explorer}/competencies", new { name = "Taken" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/curriculum/progression/competencies/{serves}")).StatusCode);
        Assert.Equal("Send every stage once.", await Error(await _factory.ClientFor(Grace).PutAsJsonAsync("/curriculum/progression/stage-order", new { stageIds = ids }), "stageIds"));
        var on = (await Get(LearningContent.Tom, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).Where(m => m != "Learning").ToArray();
        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync("/curriculum/progression")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post("/curriculum/progression/stages", new { name = "Off" })).StatusCode);
        Assert.Equal(["Shows kindness", "Tries new things"], Names((await Get(Grace, "/curriculum/progression")).GetProperty("stages")[0]));
    }

    private static IEnumerable<string?> Names(JsonElement stage) => stage.GetProperty("competencies").EnumerateArray().Select(c => c.GetProperty("name").GetString());

    private async Task<List<JsonElement>> Stages() => (await Get(LearningContent.Marisol, "/curriculum/progression")).GetProperty("stages").EnumerateArray().ToList();

    private async Task LearningOn(Guid admin)
    {
        var on = (await Get(admin, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).Append("Learning").ToArray();
        Assert.True((await _factory.ClientFor(admin).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);
    }

    private Task<HttpResponseMessage> Post(string path, object body) => _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync(path, body);

    private Task<HttpResponseMessage> Put(string path, object body) => _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync(path, body);

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private static async Task<string?> Error(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString();
    }

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
