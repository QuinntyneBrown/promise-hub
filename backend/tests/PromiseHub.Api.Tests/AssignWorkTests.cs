using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-092 criteria 1 to 4 and 7 (a mentor is offered the published lessons, quizzes and assignments of the tracks
// his youth follow, his youth and his cohorts; assigns one to chosen youth or a whole cohort he is on with a due date and a message, field-by-field errors, every youth
// following the item's track, one row per youth and item, audited without the message; Learning or Mentoring off; scope, roles and tenancy),
// L2-065, L2-007, L2-032.
public sealed class AssignWorkTests : IAsyncLifetime
{
    private static readonly Guid Marisol = LearningContent.Marisol;
    private static readonly Guid Tom = LearningContent.Tom;
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = MentorReviewWork.Daniel;
    private static readonly Guid Samuel = MentorReviewWork.Samuel;
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = LearningContent.Tutoring;
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Nadia = LearningContent.NadiaChild;
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid Lucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");
    private const string Message = "Read this before Tutoring night next week. Come ready to share one way you served someone.";

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _work = null!;
    private LearningContent _c = null!;

    // ---- criterion 1: what he may assign and to whom

    [Fact]
    public async Task Daniel_is_offered_the_published_work_of_the_tracks_his_youth_follow_and_his_youth()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);

        var options = await Options(Daniel);

        var items = options.GetProperty("items").EnumerateArray().ToList();
        var lessons = items.Where(i => i.GetProperty("kind").GetString() == "Lesson").Select(i => i.GetProperty("title").GetString()).ToList();
        Assert.Equal(["Your Strengths", "What Matters to You", "Pick Up the Towel", "Last in Line"], lessons);
        var line = items.Single(i => i.GetProperty("id").GetGuid() == _c.Line);
        Assert.Equal("Leading by Serving", line.GetProperty("moduleTitle").GetString());
        Assert.Equal(_c.Leadership, line.GetProperty("trackId").GetGuid());
        Assert.Contains(items, i => i.GetProperty("id").GetGuid() == quiz && i.GetProperty("kind").GetString() == "Quiz");
        Assert.Contains(items, i => i.GetProperty("id").GetGuid() == _work.Assignment && i.GetProperty("kind").GetString() == "Assignment");
        Assert.DoesNotContain(items, i => i.GetProperty("id").GetGuid() == _c.Circle || i.GetProperty("id").GetGuid() == _c.Voice);
        var nadia = Assert.Single(options.GetProperty("youth").EnumerateArray());
        Assert.Equal("Nadia Haddad", nadia.GetProperty("name").GetString());
        Assert.Equal([_c.Leadership], nadia.GetProperty("trackIds").EnumerateArray().Select(t => t.GetGuid()));
        Assert.Equal("After-School Tutoring", nadia.GetProperty("cohorts").GetString());
        Assert.False(nadia.GetProperty("atRisk").GetBoolean());
        Assert.Empty(options.GetProperty("cohorts").EnumerateArray());
    }

    // ---- criteria 2 and 4: assigning to chosen youth, audited without the message

    [Fact]
    public async Task Daniel_assigns_Last_in_Line_to_Nadia_and_it_is_audited_without_the_message()
    {
        var response = await Assign(Daniel, Body([Nadia]));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, result.GetProperty("count").GetInt32());
        Assert.Equal("Last in Line", result.GetProperty("title").GetString());
        Assert.Equal("2026-11-13", result.GetProperty("dueOn").GetString());
        var rows = _work.Query("SELECT Kind || ' ' || DueOn || ' ' || Message FROM AssignedWork");
        Assert.Equal(["Lesson 2026-11-13 " + Message], rows);
        var audit = _work.Query("SELECT Summary || ' ' || AfterJson FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'AssignedWork'");
        Assert.Single(audit);
        Assert.Contains("Daniel Osei assigned Last in Line to 1 youth", audit[0]);
        Assert.Contains("\"Kind\":\"Lesson\"", audit[0]);
        Assert.Contains("2026-11-13", audit[0]);
        Assert.DoesNotContain("Tutoring night", audit[0]);
    }

    [Fact]
    public async Task Assigning_the_same_item_again_replaces_her_due_date_and_message()
    {
        await Assign(Daniel, Body([Nadia]));
        Assert.Equal(HttpStatusCode.Created, (await Assign(Daniel, Body([Nadia]) with { dueOn = "2026-11-20", message = null })).StatusCode);

        Assert.Equal(["2026-11-20 "], _work.Query("SELECT DueOn || ' ' || coalesce(Message, '') FROM AssignedWork"));
    }

    // ---- criteria 1 and 2: a whole cohort he is on

    [Fact]
    public async Task Daniel_is_offered_the_cohorts_he_is_on_and_assigns_to_the_whole_roster_of_one()
    {
        await Team(Tutoring);

        var cohort = Assert.Single((await Options(Daniel)).GetProperty("cohorts").EnumerateArray());
        Assert.Equal("After-School Tutoring", cohort.GetProperty("name").GetString());
        Assert.Equal(5, cohort.GetProperty("youthCount").GetInt32());
        Assert.Equal(_c.Leadership, cohort.GetProperty("trackId").GetGuid());

        var response = await Assign(Daniel, Body([]) with { programId = Tutoring });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(5, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("count").GetInt32());
        Assert.Equal(5, _work.Query($"SELECT Id FROM AssignedWork WHERE upper(ProgramId) = upper('{Tutoring}')").Count);
        var audit = Assert.Single(_work.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'AssignedWork'"));
        Assert.Contains("assigned Last in Line to 5 youth", audit);
    }

    [Fact]
    public async Task A_cohort_and_chosen_youth_together_a_cohort_on_another_track_and_a_cohort_he_is_not_on_are_refused()
    {
        await Team(Tutoring);
        await Team(Sports);

        var both = await Errors(await Assign(Daniel, Body([Nadia]) with { programId = Tutoring }));
        Assert.Equal("Choose who it’s for.", both.GetProperty("who").GetString());
        var other = await Errors(await Assign(Daniel, Body([]) with { programId = Sports }));
        Assert.Equal("Saturday Sports doesn’t follow the track this lesson is in.", other.GetProperty("programId").GetString());
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Sports}/mentors",
            new { leadMentorId = MentorReviewWork.Hana, supportingMentorIds = Array.Empty<Guid>() })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Assign(Daniel, Body([]) with { programId = Sports })).StatusCode);
        Assert.Single(_work.Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Program' AND upper(RecordId) = upper('{Sports}')"));
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(Daniel, Body([]) with { programId = Guid.NewGuid() })).StatusCode);
        Assert.Empty(_work.Query("SELECT Id FROM AssignedWork"));
    }

    // ---- criterion 3: each field checked on the server

    [Fact]
    public async Task Missing_and_invalid_fields_are_refused_field_by_field_and_nothing_is_saved()
    {
        var empty = await Errors(await Assign(Daniel, new { kind = (string?)null, itemId = (Guid?)null, childIds = Array.Empty<Guid>(), programId = (Guid?)null, dueOn = (string?)null }));
        Assert.Equal("Choose what to assign.", empty.GetProperty("itemId").GetString());
        Assert.Equal("Choose who it’s for.", empty.GetProperty("who").GetString());
        Assert.Equal("Choose a due date.", empty.GetProperty("dueOn").GetString());

        var wrong = await Errors(await Assign(Daniel, Body([Nadia]) with { dueOn = "2026-11-04", message = new string('a', 501) }));
        Assert.Equal("The due date can’t be in the past.", wrong.GetProperty("dueOn").GetString());
        Assert.Equal("Keep it to 500 characters.", wrong.GetProperty("message").GetString());

        var kind = await Errors(await Assign(Daniel, Body([Nadia]) with { kind = "Quiz" }));
        Assert.Equal("Choose what to assign.", kind.GetProperty("itemId").GetString());
        var draft = await Errors(await Assign(Daniel, Body([Nadia]) with { itemId = _c.Circle }));
        Assert.Equal("Choose what to assign.", draft.GetProperty("itemId").GetString());
        Assert.Empty(_work.Query("SELECT Id FROM AssignedWork"));
    }

    [Fact]
    public async Task Every_youth_must_follow_the_track_of_the_item()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Sports}/youth/{Kevin}/mentor", new { mentorId = Daniel })).StatusCode);

        var errors = await Errors(await Assign(Daniel, Body([Nadia, Kevin])));

        Assert.Equal("Kevin Tran doesn’t follow the track this lesson is in.", errors.GetProperty("childIds").GetString());
        Assert.Empty(_work.Query("SELECT Id FROM AssignedWork"));
    }

    // ---- criterion 6: assigning needs Mentoring and Learning

    [Fact]
    public async Task With_Learning_or_Mentoring_off_both_endpoints_answer_404_and_every_assignment_is_kept()
    {
        Assert.Equal(HttpStatusCode.Created, (await Assign(Daniel, Body([Nadia]))).StatusCode);

        foreach (var on in new[] { new[] { "Roster", "RollCall", "Mentoring" }, new[] { "Roster", "RollCall", "Learning" } })
        {
            Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync("/mentoring/assign-work")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await Assign(Daniel, Body([Nadia]))).StatusCode);
        }
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Learning", "Mentoring" } })).IsSuccessStatusCode);
        Assert.Single(_work.Query("SELECT Id FROM AssignedWork"));
        Assert.Single((await Options(Daniel)).GetProperty("youth").EnumerateArray());
    }

    // ---- criterion 7: scope, tenancy and roles

    [Fact]
    public async Task A_youth_outside_his_scope_another_organization_and_other_roles_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Assign(Daniel, Body([Nadia, Amara]))).StatusCode);
        Assert.Single(_work.Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Child' AND upper(RecordId) = upper('{Amara}')"));
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(Daniel, Body([Lucia]))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(Daniel, Body([Guid.NewGuid()]))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(Daniel, Body([Nadia]) with { itemId = Guid.NewGuid() })).StatusCode);
        foreach (var who in new[] { Marisol, Tom, Jaylen, LearningContent.Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Assign(who, Body([Nadia]))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/mentoring/assign-work")).StatusCode);
        }
        Assert.Empty(_work.Query("SELECT Id FROM AssignedWork"));
    }

    [Fact]
    public async Task With_both_modules_on_at_Northgate_its_mentor_is_offered_nothing_of_Harbourview_and_cannot_assign_there()
    {
        Assert.True((await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring", "Learning" } })).IsSuccessStatusCode);

        var options = await Options(Samuel);
        Assert.Empty(options.GetProperty("items").EnumerateArray());
        Assert.Empty(options.GetProperty("youth").EnumerateArray());
        Assert.Empty(options.GetProperty("cohorts").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(Samuel, Body([Nadia]))).StatusCode);
        Assert.Empty(_work.Query("SELECT Id FROM AssignedWork"));
    }

    private async Task Team(Guid program) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{program}/mentors",
            new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() })).StatusCode);

    private sealed record AssignBody(string kind, Guid itemId, Guid[] childIds, Guid? programId, string dueOn, string? message);

    private AssignBody Body(Guid[] children) => new("Lesson", _c.Line, children, null, "2026-11-13", Message);

    private Task<HttpResponseMessage> Assign(Guid membership, object body) => _factory.ClientFor(membership).PostAsJsonAsync("/mentoring/assigned-work", body);

    private async Task<JsonElement> Options(Guid membership)
    {
        var response = await _factory.ClientFor(membership).GetAsync("/mentoring/assign-work");
        Assert.True(response.IsSuccessStatusCode, $"assign-work answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    public async Task InitializeAsync()
    {
        _work = await new MentorReviewWork(_factory).BuildAsync();
        _c = _work.Content;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
