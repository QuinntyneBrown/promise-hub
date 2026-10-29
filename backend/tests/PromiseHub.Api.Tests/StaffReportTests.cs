using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-128 criteria 1 to 5 (each mentor's cohorts, caseload, check-ins and reviews in the period and load against
// 4 to 8; the period; Mentoring and Reports off; roles; tenancy).
public sealed class StaffReportTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task Each_mentor_shows_cohorts_caseload_check_ins_reviews_and_load_with_totals()
    {
        await Team();
        await _w.AssignAsync(Mateo, MentorReviewWork.Daniel);
        await CheckIn(LearningContent.NadiaChild, "2026-11-03");
        await CheckIn(Mateo, "2026-09-20");
        await AcceptAsync();

        var report = await Get(LearningContent.Marisol, "/reports/staff");

        var mentors = report.GetProperty("mentors").EnumerateArray().ToList();
        Assert.Equal(["Daniel Osei", "Hana Kim"], mentors.Select(m => m.GetProperty("name").GetString()));
        var daniel = mentors[0];
        var cohort = Assert.Single(daniel.GetProperty("cohorts").EnumerateArray());
        Assert.Equal("After-School Tutoring", cohort.GetProperty("name").GetString());
        Assert.False(cohort.GetProperty("lead").GetBoolean());
        Assert.Equal(2, daniel.GetProperty("caseload").GetInt32());
        Assert.Equal(2, daniel.GetProperty("checkIns").GetInt32());
        Assert.Equal(1, daniel.GetProperty("reviews").GetInt32());
        Assert.Equal("Underloaded", daniel.GetProperty("load").GetString());
        Assert.True(mentors[1].GetProperty("cohorts").EnumerateArray().Single().GetProperty("lead").GetBoolean());
        Assert.Equal(0, mentors[1].GetProperty("caseload").GetInt32());
        Assert.Equal(2, report.GetProperty("activeMentors").GetInt32());
        Assert.Equal(2, report.GetProperty("checkIns").GetInt32());
        Assert.Equal(1, report.GetProperty("reviews").GetInt32());
        Assert.Equal(1.0, report.GetProperty("averageCaseload").GetDouble());
    }

    [Fact]
    public async Task A_period_counts_only_check_ins_and_reviews_within_that_many_days_and_another_period_is_refused()
    {
        await _w.AssignAsync(Mateo, MentorReviewWork.Daniel);
        await CheckIn(LearningContent.NadiaChild, "2026-11-03");
        await CheckIn(Mateo, "2026-09-20");

        var month = await Get(LearningContent.Marisol, "/reports/staff?days=30");
        var refused = await _factory.ClientFor(LearningContent.Marisol).GetAsync("/reports/staff?days=7");

        Assert.Equal(1, month.GetProperty("mentors").EnumerateArray().First().GetProperty("checkIns").GetInt32());
        Assert.Equal(2, (await Get(LearningContent.Marisol, "/reports/staff?days=90")).GetProperty("checkIns").GetInt32());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal("Choose 30 or 90 days, or all time.", (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("days").GetString());
    }

    [Fact]
    public async Task More_than_eight_youth_is_overloaded_and_four_to_eight_balanced()
    {
        foreach (var child in new[] { Mateo, DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera"), DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson") })
        {
            await _w.AssignAsync(child, MentorReviewWork.Daniel);
        }
        Assert.Equal("Balanced", (await Daniel()).GetProperty("load").GetString());

        for (var i = 0; i < 5; i++)
        {
            var copy = Guid.NewGuid().ToString().ToUpperInvariant();
            _w.Execute($"CREATE TEMP TABLE c AS SELECT * FROM Children WHERE upper(Id) = upper('{Mateo}'); UPDATE c SET Id = '{copy}'; INSERT INTO Children SELECT * FROM c; DROP TABLE c;");
            _w.Execute($"CREATE TEMP TABLE y AS SELECT * FROM YouthMentors WHERE upper(ChildId) = upper('{Mateo}'); UPDATE y SET Id = '{Guid.NewGuid().ToString().ToUpperInvariant()}', ChildId = '{copy}'; INSERT INTO YouthMentors SELECT * FROM y; DROP TABLE y;");
        }

        var daniel = await Daniel();
        Assert.Equal(9, daniel.GetProperty("caseload").GetInt32());
        Assert.Equal("Overloaded", daniel.GetProperty("load").GetString());
    }

    [Fact]
    public async Task With_Learning_off_reviews_are_null()
    {
        await Modules(LearningContent.Tom, [.. Suite, "Mentoring"]);

        var report = await Get(LearningContent.Marisol, "/reports/staff");

        Assert.Equal(JsonValueKind.Null, report.GetProperty("reviews").ValueKind);
        Assert.All(report.GetProperty("mentors").EnumerateArray(), m => Assert.Equal(JsonValueKind.Null, m.GetProperty("reviews").ValueKind));
    }

    [Fact]
    public async Task With_Mentoring_or_Reports_off_it_answers_404()
    {
        await Modules(LearningContent.Tom, [.. Suite, "Learning"]);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync("/reports/staff")).StatusCode);

        await Modules(LearningContent.Tom, ["Roster", "RollCall", "Learning", "Mentoring"]);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync("/reports/staff")).StatusCode);
    }

    [Fact]
    public async Task Staff_without_ViewReports_and_participants_get_403_and_another_organization_sees_only_its_mentors()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync("/reports/staff")).StatusCode);
        foreach (var who in new[] { Aisha, MentorReviewWork.Daniel, LearningContent.Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/reports/staff")).StatusCode);
        }
        await Modules(Grace, ["Roster", "RollCall", "QuickCards", "Reports", "Mentoring"]);

        var northgate = await Get(Grace, "/reports/staff");

        Assert.Equal(["Samuel Boateng"], northgate.GetProperty("mentors").EnumerateArray().Select(m => m.GetProperty("name").GetString()));
        Assert.Equal(0, northgate.GetProperty("checkIns").GetInt32());
    }

    private async Task<JsonElement> Daniel() =>
        (await Get(LearningContent.Marisol, "/reports/staff")).GetProperty("mentors").EnumerateArray().Single(m => m.GetProperty("name").GetString() == "Daniel Osei");

    private async Task Team() =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/programs/{LearningContent.Tutoring}/mentors",
            new { leadMentorId = MentorReviewWork.Hana, supportingMentorIds = new[] { MentorReviewWork.Daniel } })).StatusCode);

    private async Task CheckIn(Guid child, string date) =>
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync("/mentoring/check-ins",
            new { childId = child, date, kind = "OneToOne", engagement = "Steady", topics = (string?)null, actionItems = (string?)null, privateNotes = (string?)null, followUpOn = (string?)null, shared = false, guardianInformed = false })).StatusCode);

    private async Task AcceptAsync()
    {
        var id = await _w.SubmitAsync();
        var view = await Get(MentorReviewWork.Daniel, $"/mentoring/submissions/{id}");
        var criteria = view.GetProperty("rubric").EnumerateArray().Select(r => r.GetProperty("id").GetGuid()).ToList();
        var scores = criteria.Select((c, i) => new { criterionId = c, points = i == 2 ? 5 : 10 }).ToArray();
        var graded = await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync($"/mentoring/submissions/{id}/grade",
            new { decision = "approve", scores, comment = "Well done.", version = view.GetProperty("version").GetInt32() });
        Assert.True(graded.IsSuccessStatusCode, $"grade answered {graded.StatusCode}: {await graded.Content.ReadAsStringAsync()}");
    }

    private async Task Modules(Guid who, string[] on) =>
        Assert.True((await _factory.ClientFor(who).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
