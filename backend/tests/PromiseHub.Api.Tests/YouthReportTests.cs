using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-127 criteria 3 to 6 (the youth report: learning while Learning is on and a youth account exists, attendance
// while Roll Call is on, mentoring while Mentoring is on without a check-in's notes; roles, tenancy, Reports off).
public sealed class YouthReportTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid NorthgateLucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task A_youth_report_shows_learning_attendance_and_mentoring_but_never_a_check_ins_notes()
    {
        await _w.TakeAsync(await _w.Content.QuizAsync(_w.Content.Knowing, attempts: null), allRight: true);
        await CheckIn(LearningContent.NadiaChild);
        await MentorCheckIn(LearningContent.NadiaChild);
        await Raise(LearningContent.NadiaChild);

        var response = await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/youth/{LearningContent.NadiaChild}");
        var text = await response.Content.ReadAsStringAsync();
        var report = JsonDocument.Parse(text).RootElement;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Nadia Haddad", report.GetProperty("name").GetString());
        Assert.True(report.GetProperty("hasAccount").GetBoolean());
        Assert.Equal(["After-School Tutoring"], report.GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
        var learning = report.GetProperty("learning");
        Assert.Equal(2, learning.GetProperty("completedLessons").GetInt32());
        Assert.Equal(4, learning.GetProperty("totalLessons").GetInt32());
        Assert.Equal(50, learning.GetProperty("completion").GetInt32());
        Assert.Equal(100, learning.GetProperty("quizAverage").GetInt32());
        var modules = learning.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.Equal(["Done", "NotStarted"], modules.Select(m => m.GetProperty("state").GetString()));
        Assert.Equal([2, 0], modules.Select(m => m.GetProperty("done").GetInt32()));
        Assert.Equal([2, 2], modules.Select(m => m.GetProperty("total").GetInt32()));
        var quiz = Assert.Single(learning.GetProperty("quizzes").EnumerateArray());
        Assert.Equal("Knowing Yourself quiz", quiz.GetProperty("title").GetString());
        Assert.Equal(100, quiz.GetProperty("bestScore").GetInt32());
        var attendance = report.GetProperty("attendance");
        Assert.Equal(1, attendance.GetProperty("present").GetInt32() + attendance.GetProperty("late").GetInt32());
        Assert.Equal(0, attendance.GetProperty("absent").GetInt32());
        Assert.Equal(100, attendance.GetProperty("rate").GetInt32());
        var mentoring = report.GetProperty("mentoring");
        Assert.Equal("Daniel Osei", mentoring.GetProperty("mentorName").GetString());
        Assert.Equal(1, mentoring.GetProperty("checkIns").GetInt32());
        Assert.Equal("2026-11-03", mentoring.GetProperty("latestOn").GetString());
        Assert.Equal("Engaged", mentoring.GetProperty("latestEngagement").GetString());
        Assert.True(mentoring.GetProperty("openFlag").GetBoolean());
        Assert.DoesNotContain("Only for Daniel", text);
        Assert.DoesNotContain("Spoke about school", text);
    }

    [Fact]
    public async Task A_child_without_a_youth_account_has_no_learning_but_attendance_and_mentoring()
    {
        await CheckIn(Mateo);

        var report = await Get(LearningContent.Marisol, $"/reports/youth/{Mateo}");

        Assert.False(report.GetProperty("hasAccount").GetBoolean());
        Assert.Equal(JsonValueKind.Null, report.GetProperty("learning").ValueKind);
        Assert.Equal(9, report.GetProperty("age").GetInt32());
        Assert.Equal(1, report.GetProperty("attendance").GetProperty("present").GetInt32() + report.GetProperty("attendance").GetProperty("late").GetInt32());
        Assert.Equal(JsonValueKind.Null, report.GetProperty("mentoring").GetProperty("mentorName").ValueKind);
        Assert.Equal(0, report.GetProperty("mentoring").GetProperty("checkIns").GetInt32());
    }

    [Fact]
    public async Task With_Learning_Mentoring_and_Roll_Call_off_their_sections_are_null()
    {
        await Modules(LearningContent.Tom, [.. Suite.Where(m => m != "RollCall" && m != "Pickup")]);

        var report = await Get(LearningContent.Marisol, $"/reports/youth/{LearningContent.NadiaChild}");

        Assert.Equal(JsonValueKind.Null, report.GetProperty("learning").ValueKind);
        Assert.Equal(JsonValueKind.Null, report.GetProperty("mentoring").ValueKind);
        Assert.Equal(JsonValueKind.Null, report.GetProperty("attendance").ValueKind);
    }

    [Fact]
    public async Task Staff_without_ViewReports_and_participants_get_403()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync($"/reports/youth/{Mateo}")).StatusCode);
        foreach (var who in new[] { Aisha, MentorReviewWork.Daniel, LearningContent.Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/reports/youth/{Mateo}")).StatusCode);
        }
    }

    [Fact]
    public async Task Another_organizations_child_or_an_unknown_one_is_not_found()
    {
        await Modules(Grace, ["Roster", "RollCall", "QuickCards", "Reports"]);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/reports/youth/{LearningContent.NadiaChild}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/youth/{NorthgateLucia}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/youth/{Guid.NewGuid()}")).StatusCode);
        Assert.Equal("Lucía Rivera", (await Get(Grace, $"/reports/youth/{NorthgateLucia}")).GetProperty("name").GetString());
    }

    [Fact]
    public async Task With_Reports_off_it_answers_404()
    {
        await Modules(LearningContent.Tom, ["Roster", "RollCall", "Learning", "Mentoring"]);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/youth/{Mateo}")).StatusCode);
    }

    private async Task CheckIn(Guid child) =>
        Assert.True((await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = child, arrivedAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() })).IsSuccessStatusCode);

    private async Task MentorCheckIn(Guid child) =>
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(MentorReviewWork.Daniel).PostAsJsonAsync("/mentoring/check-ins",
            new { childId = child, date = "2026-11-03", kind = "OneToOne", engagement = "Engaged", topics = "Spoke about school", actionItems = (string?)null, privateNotes = "Only for Daniel", followUpOn = (string?)null, shared = false, guardianInformed = false })).StatusCode);

    private async Task Raise(Guid child) =>
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
