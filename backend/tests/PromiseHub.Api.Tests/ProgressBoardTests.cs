using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-131 criteria 1, 4 and 5 (a row per enrolled youth and a cell per module of the cohort's track, the quiz
// average, overall and the cohort average; no track; Learning and Reports off; roles; tenancy).
public sealed class ProgressBoardTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task The_board_shows_each_youth_by_module_with_quiz_average_overall_and_the_cohort_average()
    {
        await _w.TakeAsync(await _w.Content.QuizAsync(_w.Content.Knowing, attempts: null), allRight: true);

        var board = await Get(LearningContent.Marisol, $"/reports/progress/{LearningContent.Tutoring}");

        Assert.Equal("After-School Tutoring", board.GetProperty("programName").GetString());
        Assert.Equal("Leadership Foundations", board.GetProperty("trackName").GetString());
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], board.GetProperty("modules").EnumerateArray().Select(m => m.GetProperty("title").GetString()));
        var rows = board.GetProperty("youth").EnumerateArray().ToList();
        Assert.Equal(["Jordan Thompson", "Mateo Rivera", "Nadia Haddad", "Sofía Rivera", "Yusuf Haddad"], rows.Select(r => r.GetProperty("name").GetString()));
        Assert.Equal(["NoAccount", "NoAccount"], Cells(rows[1]));
        Assert.Equal(JsonValueKind.Null, rows[1].GetProperty("overall").ValueKind);
        Assert.Equal(["Done", "NotStarted"], Cells(rows[2]));
        Assert.Equal(100, rows[2].GetProperty("quizAverage").GetInt32());
        Assert.Equal(50, rows[2].GetProperty("overall").GetInt32());
        Assert.Equal(["NotStarted", "NotStarted"], Cells(rows[3]));
        Assert.Equal(JsonValueKind.Null, rows[3].GetProperty("quizAverage").ValueKind);
        Assert.Equal(0, rows[3].GetProperty("overall").GetInt32());
        var average = board.GetProperty("average");
        Assert.Equal([50, 0], average.GetProperty("modules").EnumerateArray().Select(m => m.GetInt32()));
        Assert.Equal(100, average.GetProperty("quizAverage").GetInt32());
        Assert.Equal(25, average.GetProperty("overall").GetInt32());
    }

    [Fact]
    public async Task Some_lessons_done_reads_in_progress()
    {
        Assert.True((await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{_w.Content.Strengths}/complete", null)).IsSuccessStatusCode);

        var board = await Get(LearningContent.Marisol, $"/reports/progress/{LearningContent.Tutoring}");

        var nadia = board.GetProperty("youth").EnumerateArray().Single(r => r.GetProperty("name").GetString() == "Nadia Haddad");
        Assert.Equal(["InProgress", "NotStarted"], Cells(nadia));
        Assert.Equal(25, nadia.GetProperty("overall").GetInt32());
    }

    [Fact]
    public async Task A_cohort_that_follows_no_track_has_no_modules()
    {
        var board = await Get(LearningContent.Marisol, $"/reports/progress/{Sports}");

        Assert.Equal(JsonValueKind.Null, board.GetProperty("trackName").ValueKind);
        Assert.Empty(board.GetProperty("modules").EnumerateArray());
        Assert.Equal(["Emily Tran", "Kevin Tran"], board.GetProperty("youth").EnumerateArray().Select(r => r.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task With_Learning_or_Reports_off_it_answers_404()
    {
        await Modules(LearningContent.Tom, [.. Suite, "Mentoring"]);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/progress/{LearningContent.Tutoring}")).StatusCode);

        await Modules(LearningContent.Tom, ["Roster", "RollCall", "Learning", "Mentoring"]);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/progress/{LearningContent.Tutoring}")).StatusCode);
    }

    [Fact]
    public async Task Staff_without_ViewReports_and_participants_get_403_and_another_organizations_program_is_not_found()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync($"/reports/progress/{LearningContent.Tutoring}")).StatusCode);
        foreach (var who in new[] { Aisha, MentorReviewWork.Daniel, LearningContent.Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/reports/progress/{LearningContent.Tutoring}")).StatusCode);
        }
        await Modules(Grace, ["Roster", "RollCall", "QuickCards", "Reports", "Learning"]);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/reports/progress/{LearningContent.Tutoring}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/progress/{Guid.NewGuid()}")).StatusCode);
    }

    private static List<string?> Cells(JsonElement row) => [.. row.GetProperty("cells").EnumerateArray().Select(c => c.GetString())];

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
