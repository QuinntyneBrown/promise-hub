using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-127 criteria 1, 2, 4, 5 and 6 (the cohort report: enrolment, retention, attendance, learning per youth and
// module while Learning is on, at-risk and check-ins while Mentoring is on, the comparison; roles, tenancy, Reports off).
public sealed class CohortReportTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task A_director_sees_enrolment_retention_attendance_and_each_youth_with_learning_check_ins_and_status()
    {
        await _w.TakeAsync(await _w.Content.QuizAsync(_w.Content.Knowing, attempts: null), allRight: true);
        await Attendance();
        await CheckInAsync(LearningContent.NadiaChild);
        await RaiseAsync(LearningContent.NadiaChild);

        var report = await Get(LearningContent.Marisol, $"/reports/cohorts/{LearningContent.Tutoring}");

        Assert.Equal("After-School Tutoring", report.GetProperty("name").GetString());
        Assert.Equal("Leadership Foundations", report.GetProperty("trackName").GetString());
        Assert.Equal(5, report.GetProperty("enrolled").GetInt32());
        Assert.Equal(0, report.GetProperty("ended").GetInt32());
        Assert.Equal(100, report.GetProperty("retentionRate").GetInt32());
        Assert.Equal(50, report.GetProperty("attendanceRate").GetInt32());
        Assert.Equal(1, report.GetProperty("atRisk").GetInt32());
        var youth = report.GetProperty("youth").EnumerateArray().ToList();
        Assert.Equal(["Jordan Thompson", "Mateo Rivera", "Nadia Haddad", "Sofía Rivera", "Yusuf Haddad"], youth.Select(y => y.GetProperty("name").GetString()));
        var nadia = youth[2];
        Assert.True(nadia.GetProperty("hasAccount").GetBoolean());
        Assert.Equal(50, nadia.GetProperty("learning").GetInt32());
        Assert.Equal(1, nadia.GetProperty("checkIns").GetInt32());
        Assert.Equal("AtRisk", nadia.GetProperty("status").GetString());
        Assert.Equal(0, youth[3].GetProperty("learning").GetInt32());
        Assert.False(youth[1].GetProperty("hasAccount").GetBoolean());
        Assert.Equal(JsonValueKind.Null, youth[1].GetProperty("learning").ValueKind);
        Assert.Equal(100, youth[1].GetProperty("attendanceRate").GetInt32());
        Assert.Equal(0, youth[3].GetProperty("attendanceRate").GetInt32());
        Assert.Equal("OnTrack", youth[1].GetProperty("status").GetString());
        var learning = report.GetProperty("learning");
        Assert.Equal(25, learning.GetProperty("averageCompletion").GetInt32());
        var modules = learning.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.Equal([50, 0], modules.Select(m => m.GetProperty("completion").GetInt32()));
        var comparison = report.GetProperty("comparison");
        Assert.Equal(50, comparison.GetProperty("attendanceRate").GetInt32());
        Assert.Equal(100, comparison.GetProperty("retentionRate").GetInt32());
        Assert.Equal(25, comparison.GetProperty("averageCompletion").GetInt32());
    }

    [Fact]
    public async Task An_ended_enrollment_counts_against_retention_and_reads_Ended()
    {
        _w.Execute($"UPDATE Enrollments SET EndedAt = '2026-10-30 12:00:00+00:00', EndReason = 'Moved away' WHERE upper(ChildId) = upper('{Jordan}')");

        var report = await Get(LearningContent.Marisol, $"/reports/cohorts/{LearningContent.Tutoring}");

        Assert.Equal(4, report.GetProperty("enrolled").GetInt32());
        Assert.Equal(1, report.GetProperty("ended").GetInt32());
        Assert.Equal(80, report.GetProperty("retentionRate").GetInt32());
        Assert.Equal("Ended", report.GetProperty("youth").EnumerateArray().First().GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_program_that_follows_no_track_has_no_modules_and_no_average()
    {
        var report = await Get(LearningContent.Marisol, $"/reports/cohorts/{Sports}");

        Assert.Equal(JsonValueKind.Null, report.GetProperty("trackName").ValueKind);
        Assert.Empty(report.GetProperty("learning").GetProperty("modules").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, report.GetProperty("learning").GetProperty("averageCompletion").ValueKind);
        Assert.Equal(JsonValueKind.Null, report.GetProperty("attendanceRate").ValueKind);
    }

    [Fact]
    public async Task With_Learning_and_Mentoring_off_their_sections_are_null()
    {
        await RaiseAsync(LearningContent.NadiaChild);
        await Modules(LearningContent.Tom, Suite);

        var report = await Get(LearningContent.Marisol, $"/reports/cohorts/{LearningContent.Tutoring}");

        Assert.Equal(JsonValueKind.Null, report.GetProperty("learning").ValueKind);
        Assert.Equal(JsonValueKind.Null, report.GetProperty("atRisk").ValueKind);
        Assert.Equal(JsonValueKind.Null, report.GetProperty("comparison").GetProperty("averageCompletion").ValueKind);
        var nadia = report.GetProperty("youth").EnumerateArray().Single(y => y.GetProperty("name").GetString() == "Nadia Haddad");
        Assert.Equal(JsonValueKind.Null, nadia.GetProperty("learning").ValueKind);
        Assert.Equal(JsonValueKind.Null, nadia.GetProperty("checkIns").ValueKind);
        Assert.Equal("OnTrack", nadia.GetProperty("status").GetString());
    }

    [Fact]
    public async Task With_Roll_Call_off_attendance_is_null()
    {
        await Attendance();
        await Modules(LearningContent.Tom, [.. Suite.Where(m => m != "RollCall" && m != "Pickup"), "Learning", "Mentoring"]);

        var report = await Get(LearningContent.Marisol, $"/reports/cohorts/{LearningContent.Tutoring}");

        Assert.Equal(JsonValueKind.Null, report.GetProperty("attendanceRate").ValueKind);
        Assert.All(report.GetProperty("youth").EnumerateArray(), y => Assert.Equal(JsonValueKind.Null, y.GetProperty("attendanceRate").ValueKind));
    }

    [Fact]
    public async Task A_site_lead_reads_it_and_staff_without_ViewReports_and_participants_get_403()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync($"/reports/cohorts/{LearningContent.Tutoring}")).StatusCode);
        foreach (var who in new[] { Aisha, MentorReviewWork.Daniel, Sofia, MentorReviewWork.Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/reports/cohorts/{LearningContent.Tutoring}")).StatusCode);
        }
    }

    [Fact]
    public async Task Another_organizations_program_or_an_unknown_one_is_not_found_and_Northgate_sees_only_its_own_youth()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/reports/cohorts/{LearningContent.Tutoring}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/cohorts/{KidsClub}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/cohorts/{Guid.NewGuid()}")).StatusCode);

        await Modules(Grace, ["Roster", "RollCall", "QuickCards", "Reports"]);
        var northgate = await Get(Grace, $"/reports/cohorts/{KidsClub}");

        Assert.Equal(["Mateo Rivera"], northgate.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()));
        Assert.Equal(JsonValueKind.Null, northgate.GetProperty("learning").ValueKind);
    }

    [Fact]
    public async Task With_Reports_off_it_answers_404()
    {
        await Modules(LearningContent.Tom, ["Roster", "RollCall", "Learning", "Mentoring"]);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/cohorts/{LearningContent.Tutoring}")).StatusCode);
    }

    private async Task Attendance()
    {
        Assert.True((await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() })).IsSuccessStatusCode);
        Assert.True((await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/absences", new { childId = SofiaChild, clientActionId = Guid.NewGuid() })).IsSuccessStatusCode);
    }

    private async Task CheckInAsync(Guid child) =>
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync("/mentoring/check-ins",
            new { childId = child, date = "2026-11-03", kind = "OneToOne", engagement = "Engaged", topics = "School", actionItems = (string?)null, privateNotes = "Private", followUpOn = (string?)null, shared = false, guardianInformed = false })).StatusCode);

    private async Task RaiseAsync(Guid child) =>
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync("/mentoring/flags",
            new { childId = child, severity = "Medium", reason = "Missed three sessions in a row." })).StatusCode);

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
