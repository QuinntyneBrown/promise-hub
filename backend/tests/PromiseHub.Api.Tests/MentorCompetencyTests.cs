using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-082 criteria 1 to 5 (a youth's competencies with the latest level and note, saving only what changed as new
// assessments, invalid notes and levels, no competencies, scope, roles, tenancy, Mentoring off and Learning off), L2-032.
public sealed class MentorCompetencyTests : IAsyncLifetime
{
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid Lucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");
    private static readonly string[] Harbourview = ["Serves others", "Speaks up", "Leads a small group", "Follows through", "Works with others"];
    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;
    private string Path => $"/mentoring/youth/{LearningContent.NadiaChild}/competencies";

    [Fact]
    public async Task A_youth_starts_with_every_competency_of_the_organization_not_started()
    {
        var sheet = await Get();

        Assert.Equal("Nadia Haddad", sheet.GetProperty("name").GetString());
        var items = sheet.GetProperty("items").EnumerateArray().ToList();
        Assert.Equal(Harbourview, items.Select(i => i.GetProperty("name").GetString()));
        Assert.Equal("Notices what needs doing and helps without being asked.", items[0].GetProperty("description").GetString());
        Assert.All(items, i => Assert.Equal("NotStarted", i.GetProperty("level").GetString()));
        Assert.All(items, i => Assert.Equal(JsonValueKind.Null, i.GetProperty("assessedAt").ValueKind));
        Assert.Equal(0, sheet.GetProperty("proficientOrMastered").GetInt32());
        Assert.Equal(5, sheet.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task Saving_appends_an_assessment_for_each_changed_competency_and_the_latest_shows()
    {
        var items = (await Get()).GetProperty("items").EnumerateArray().ToList();
        var ids = items.Select(i => i.GetProperty("id").GetGuid()).ToList();

        var saved = await Save(ids, ("Proficient", "Stacked the chairs two weeks running."), ("Developing", null));

        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var sheet = await saved.Content.ReadFromJsonAsync<JsonElement>();
        var serves = sheet.GetProperty("items")[0];
        Assert.Equal("Proficient", serves.GetProperty("level").GetString());
        Assert.Equal("Stacked the chairs two weeks running.", serves.GetProperty("notes").GetString());
        Assert.Equal("Daniel Osei", serves.GetProperty("assessedBy").GetString());
        Assert.Equal("Developing", sheet.GetProperty("items")[1].GetProperty("level").GetString());
        Assert.Equal(1, sheet.GetProperty("proficientOrMastered").GetInt32());
        Assert.Equal(2, _w.Query("SELECT Id FROM CompetencyAssessments").Count);
        Assert.Equal(2, _w.Query("SELECT Id FROM AuditEntries WHERE RecordType = 'CompetencyAssessment' AND Action = 'Created'").Count);

        Assert.Equal(HttpStatusCode.OK, (await Save(ids, ("Proficient", "Stacked the chairs two weeks running."), ("Developing", null))).StatusCode);
        Assert.Equal(2, _w.Query("SELECT Id FROM CompetencyAssessments").Count);

        var again = await (await Save(ids, ("Mastered", "Leads the clean-up now."), ("Developing", null))).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Mastered", again.GetProperty("items")[0].GetProperty("level").GetString());
        Assert.Equal(3, _w.Query("SELECT Id FROM CompetencyAssessments").Count);
    }

    [Fact]
    public async Task A_long_note_an_unknown_level_or_another_organizations_competency_is_refused_and_nothing_is_saved()
    {
        var ids = (await Get()).GetProperty("items").EnumerateArray().Select(i => i.GetProperty("id").GetGuid()).ToList();

        Assert.Equal("Keep the note to 2,000 characters.", (await Errors(await Save(ids, ("Developing", new string('a', 2001))))).GetProperty("items.0.notes").GetString());
        Assert.Equal("Choose a level.", (await Errors(await Save(ids, ("Expert", null)))).GetProperty("items.0.level").GetString());
        Assert.Equal("Assess only your organization’s competencies.", (await Errors(await Put(new[] { new { competencyId = Guid.NewGuid(), level = "Developing", notes = (string?)null } }))).GetProperty("items").GetString());
        Assert.Empty(_w.Query("SELECT Id FROM CompetencyAssessments"));
    }

    [Fact]
    public async Task An_organization_with_no_competencies_answers_an_empty_sheet()
    {
        _w.Execute("DELETE FROM Competencies");

        var sheet = await Get();

        Assert.Empty(sheet.GetProperty("items").EnumerateArray());
        Assert.Equal(0, sheet.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task A_child_who_is_not_his_another_organizations_other_roles_and_Mentoring_off_are_refused_and_Learning_off_is_not()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/youth/{Amara}/competencies")).StatusCode);
        Assert.Single(_w.Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND upper(RecordId) = upper('{Amara}')"));
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(MentorReviewWork.Daniel).PutAsJsonAsync($"/mentoring/youth/{Amara}/competencies", new { items = Array.Empty<object>() })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/youth/{Lucia}/competencies")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/youth/{Guid.NewGuid()}/competencies")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Marisol).GetAsync(Path)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Nadia).GetAsync(Path)).StatusCode);

        await Modules("Roster", "Mentoring");
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync(Path)).StatusCode);
        await Modules("Roster", "Learning");
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync(Path)).StatusCode);
    }

    private Task<HttpResponseMessage> Save(List<Guid> ids, params (string Level, string? Notes)[] changes) =>
        Put(ids.Select((id, i) => new { competencyId = id, level = i < changes.Length ? changes[i].Level : "NotStarted", notes = i < changes.Length ? changes[i].Notes : null }).ToArray());

    private Task<HttpResponseMessage> Put(object items) => _factory.ClientFor(MentorReviewWork.Daniel).PutAsJsonAsync(Path, new { items });

    private async Task Modules(params string[] on) =>
        Assert.True((await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);

    private async Task<JsonElement> Get()
    {
        var response = await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync(Path);
        Assert.True(response.IsSuccessStatusCode, $"{Path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
