using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-141 the Learning Bond dashboard: counts and sums for the organization, filtered by program and period, small counts suppressed, for
// ViewReports only. L2-143 the funder export: the same per covered program and a total row, suppressed, audited, kept 7 days.
public sealed class LearningBondDashboardTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    // A youth worker has no ViewReports (site leads do, in RolePermissions).
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-141 criterion 1.
    [Fact]
    public async Task Just_launched_every_figure_is_zero()
    {
        var dashboard = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/learning-bond/dashboard");

        var all = dashboard.GetProperty("all");
        foreach (var figure in new[] { "invited", "started", "completed", "children" })
        {
            Assert.Equal("0", all.GetProperty(figure).GetString());
        }
        Assert.Equal(0, all.GetProperty("estimated").GetProperty("total").GetInt32());
        Assert.Equal(0, all.GetProperty("confirmed").GetProperty("total").GetInt32());
        Assert.True(dashboard.GetProperty("empty").GetBoolean());
        Assert.Equal(["After-School Tutoring", "Saturday Sports", "Winter Camp 2026"], dashboard.GetProperty("programs").EnumerateArray().Select(p => p.GetProperty("name").GetString()!));
    }

    // L2-141 criteria 2 and 3: one family under way reads Fewer than 5, its dollars suppressed, overall and per program.
    [Fact]
    public async Task A_figure_resting_on_fewer_than_5_households_is_suppressed_with_its_dollars()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");

        var dashboard = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/learning-bond/dashboard?period=30");

        var all = dashboard.GetProperty("all");
        Assert.Equal("FewerThan5", all.GetProperty("invited").GetString());
        Assert.Equal("FewerThan5", all.GetProperty("started").GetString());
        Assert.Equal("FewerThan5", all.GetProperty("children").GetString());
        Assert.Equal(JsonValueKind.Null, all.GetProperty("estimated").ValueKind);
        Assert.False(dashboard.GetProperty("empty").GetBoolean());
        var tutoring = dashboard.GetProperty("rows").EnumerateArray().Single(r => r.GetProperty("program").GetString() == "After-School Tutoring");
        Assert.Equal("FewerThan5", tutoring.GetProperty("started").GetString());
        Assert.Equal(JsonValueKind.Null, tutoring.GetProperty("confirmed").ValueKind);
        Assert.DoesNotContain("Rivera", dashboard.ToString(), StringComparison.Ordinal);
        Assert.DoesNotContain("1400", dashboard.ToString(), StringComparison.Ordinal);
    }

    // L2-141 criterion 4, L2-143 criterion 4.
    [Fact]
    public async Task Without_ViewReports_it_is_forbidden_and_with_the_module_off_it_is_not_found()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).GetAsync("/learning-bond/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).PostAsJsonAsync("/learning-bond/exports", new { period = "all" })).StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages", "Reports" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/learning-bond/dashboard")).StatusCode);
    }

    // L2-143 criteria 1 to 3.
    [Fact]
    public async Task The_funder_export_has_a_row_per_program_and_a_total_suppressed_audited_and_kept_7_days()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
        var marisol = _factory.ClientFor(Marisol);

        var created = await marisol.PostAsJsonAsync("/learning-bond/exports", new { period = "all" });

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var export = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("harbourview-youth-collective-learning-bond-all-2026-11-05.csv", export.GetProperty("fileName").GetString());
        var csv = await marisol.GetStringAsync($"/reports/exports/{export.GetProperty("id").GetString()}");
        var lines = csv.Trim().Split('\n').Select(l => l.TrimEnd('\r')).ToList();
        Assert.StartsWith("Program,Households invited,Started,Completed,Children with a Learning Bond application,", lines[0], StringComparison.Ordinal);
        Assert.StartsWith("\"After-School Tutoring\",<5,<5,<5,<5,,", lines[1], StringComparison.Ordinal);
        Assert.StartsWith("Total,<5,<5,<5,<5,", lines[^1], StringComparison.Ordinal);
        Assert.DoesNotContain("Rivera", csv, StringComparison.Ordinal);
        Assert.DoesNotContain("Mateo", csv, StringComparison.Ordinal);
        Assert.Equal("Marisol Delgado|harbourview-youth-collective-learning-bond-all-2026-11-05.csv · Learning Bond · CSV · 4 rows",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE RecordType = 'ReportExport'"));

        _factory.Clock.Advance(TimeSpan.FromDays(8));
        Assert.Equal(HttpStatusCode.Gone, (await marisol.GetAsync($"/reports/exports/{export.GetProperty("id").GetString()}")).StatusCode);
    }

    // L2-141 criterion 4: another organization's claims are never counted.
    [Fact]
    public async Task Another_organizations_claims_are_never_counted()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
        var northgateDirector = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

        var theirs = await _factory.ClientFor(northgateDirector).GetAsync("/learning-bond/dashboard");

        Assert.Contains(theirs.StatusCode, new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden });
        Assert.Equal("1", Scalar("SELECT COUNT(*) FROM LearningBondApplications WHERE SubmittedAt IS NOT NULL"));
    }

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
