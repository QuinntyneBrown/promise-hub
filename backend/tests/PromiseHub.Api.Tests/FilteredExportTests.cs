using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-129 criteria 1 to 5 (the cohort, progress board and staff reports as CSV with exactly the columns on screen,
// sections of an off module left out, audited with the kind; validation, modules off, roles, tenancy).
public sealed class FilteredExportTests : IAsyncLifetime
{
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task A_cohort_export_has_a_row_per_youth_with_the_columns_on_screen_and_is_audited_with_its_kind()
    {
        await _w.TakeAsync(await _w.Content.QuizAsync(_w.Content.Knowing, attempts: null), allRight: true);

        var (export, csv) = await Export(new { kind = "Cohort", programId = LearningContent.Tutoring });

        Assert.Equal("harbourview-youth-collective-cohort-after-school-tutoring-2026-11-05.csv", export.GetProperty("fileName").GetString());
        Assert.Equal(5, export.GetProperty("rows").GetInt32());
        var lines = Lines(csv);
        Assert.Equal("Youth,Learning (%),Attendance (%),Check-ins,Status", lines[0]);
        Assert.Contains("Nadia Haddad,50,,0,On track", lines);
        Assert.Contains("Mateo Rivera,No account,,0,On track", lines);
        Assert.Equal(6, lines.Count);
        Assert.Contains("· Cohort", Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'ReportExport'"));
    }

    [Fact]
    public async Task With_Learning_and_Mentoring_off_their_columns_are_left_out()
    {
        await Modules(LearningContent.Tom, Suite);

        var (_, csv) = await Export(new { kind = "Cohort", programId = LearningContent.Tutoring });

        Assert.Equal("Youth,Attendance (%),Status", Lines(csv)[0]);
    }

    [Fact]
    public async Task A_progress_board_export_has_a_column_per_module_and_the_cohort_average()
    {
        await _w.TakeAsync(await _w.Content.QuizAsync(_w.Content.Knowing, attempts: null), allRight: true);

        var (export, csv) = await Export(new { kind = "Progress", programId = LearningContent.Tutoring });

        Assert.Equal("harbourview-youth-collective-progress-after-school-tutoring-2026-11-05.csv", export.GetProperty("fileName").GetString());
        var lines = Lines(csv);
        Assert.Equal("Youth,Knowing Yourself,Leading by Serving,Quiz average (%),Overall (%)", lines[0]);
        Assert.Contains("Nadia Haddad,Done,Not started,100,50", lines);
        Assert.Contains("Mateo Rivera,No account,No account,,", lines);
        Assert.Equal("Cohort average,50,0,100,25", lines[^1]);
    }

    [Fact]
    public async Task A_staff_export_has_a_row_per_mentor_for_the_period()
    {
        var (export, csv) = await Export(new { kind = "Staff", days = 30 });

        Assert.Equal("harbourview-youth-collective-staff-2026-11-05.csv", export.GetProperty("fileName").GetString());
        var lines = Lines(csv);
        Assert.Equal("Mentor,Cohorts,Youth,Check-ins,Reviews,Load", lines[0]);
        Assert.Contains("Daniel Osei,,1,0,0,Underloaded", lines);
        Assert.Equal(3, lines.Count);
    }

    [Fact]
    public async Task A_missing_program_or_an_unknown_kind_is_refused_and_another_organizations_program_is_not_found()
    {
        var client = _factory.ClientFor(LearningContent.Marisol);

        var missing = await client.PostAsJsonAsync("/reports/exports", new { kind = "Cohort" });
        var unknown = await client.PostAsJsonAsync("/reports/exports", new { kind = "Audit" });
        var foreign = await client.PostAsJsonAsync("/reports/exports", new { kind = "Cohort", programId = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club") });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, missing.StatusCode);
        Assert.Equal("Choose a cohort.", (await missing.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("programId").GetString());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        Assert.Equal("0", Query("SELECT count(*) FROM ReportExports"));
    }

    [Fact]
    public async Task A_progress_export_while_Learning_is_off_and_a_staff_export_while_Mentoring_is_off_are_not_found()
    {
        await Modules(LearningContent.Tom, Suite);
        var client = _factory.ClientFor(LearningContent.Marisol);

        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync("/reports/exports", new { kind = "Progress", programId = LearningContent.Tutoring })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync("/reports/exports", new { kind = "Staff" })).StatusCode);
    }

    [Fact]
    public async Task Staff_without_ViewReports_get_403_and_Northgate_exports_only_its_own()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).PostAsJsonAsync("/reports/exports", new { kind = "Cohort", programId = LearningContent.Tutoring })).StatusCode);
        await Modules(Grace, ["Roster", "RollCall", "QuickCards", "Reports"]);

        var created = await _factory.ClientFor(Grace).PostAsJsonAsync("/reports/exports", new { kind = "Cohort", programId = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club") });
        var export = await created.Content.ReadFromJsonAsync<JsonElement>();
        var csv = await _factory.ClientFor(Grace).GetStringAsync($"/reports/exports/{export.GetProperty("id").GetGuid()}");

        Assert.Equal(["Youth,Attendance (%),Status", "Mateo Rivera,,On track"], Lines(csv));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/reports/exports/{export.GetProperty("id").GetGuid()}")).StatusCode);
    }

    private async Task<(JsonElement Export, string Csv)> Export(object body)
    {
        var created = await _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync("/reports/exports", body);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var export = await created.Content.ReadFromJsonAsync<JsonElement>();
        var csv = await _factory.ClientFor(LearningContent.Marisol).GetStringAsync($"/reports/exports/{export.GetProperty("id").GetGuid()}");
        return (export, csv);
    }

    private static List<string> Lines(string csv) => [.. csv.Split('\n').Select(l => l.TrimEnd('\r')).Where(l => l.Length > 0)];

    private async Task Modules(Guid who, string[] on) =>
        Assert.True((await _factory.ClientFor(who).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);

    private string Query(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public async Task InitializeAsync()
    {
        _w = await new MentorReviewWork(_factory).BuildAsync();
        await _w.AssignAsync(DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera"), MentorReviewWork.Daniel);
        _w.Execute($"DELETE FROM YouthMentors WHERE upper(ChildId) = upper('{LearningContent.NadiaChild}')");
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
