using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-024 report numbers and filters, L2-025 exports, L2-007 roles, L2-005 Reports off, L2-001 tenant isolation, L2-032 audit.
public sealed class ReportTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_director_sees_children_served_attendance_demographics_and_languages()
    {
        await CheckIn(Mateo);
        await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/absences", new { childId = Sofia, clientActionId = Guid.NewGuid() });

        var report = await Get(Marisol, "/reports");

        Assert.Equal(6, report.GetProperty("childrenServed").GetInt32());
        Assert.Equal(50, report.GetProperty("attendanceRate").GetInt32());
        Assert.Equal("3", Band(report, "9–11"));
        Assert.Equal("2", Band(report, "12–13"));
        Assert.Equal(2, Language(report, "English"));
        Assert.Contains(report.GetProperty("programs").EnumerateArray(), p => p.GetProperty("name").GetString() == "After-School Tutoring");
    }

    [Fact]
    public async Task A_program_filter_narrows_every_number()
    {
        var report = await Get(Marisol, $"/reports?programId={Tutoring}");

        Assert.Equal(4, report.GetProperty("childrenServed").GetInt32());
        Assert.Equal("0", Band(report, "6–8"));
    }

    [Fact]
    public async Task A_site_lead_sees_counts_under_five_masked()
    {
        var report = await Get(Jaylen, "/reports");

        Assert.Equal("<5", Band(report, "9–11"));
        Assert.True(report.GetProperty("masked").GetBoolean());
    }

    [Fact]
    public async Task An_export_writes_a_csv_with_small_counts_masked_audits_it_and_expires_in_seven_days()
    {
        var created = await _factory.ClientFor(Marisol).PostAsJsonAsync("/reports/exports", new { programId = (Guid?)null });
        var export = await created.Content.ReadFromJsonAsync<JsonElement>();
        var download = await _factory.ClientFor(Marisol).GetAsync($"/reports/exports/{export.GetProperty("id").GetGuid()}");
        var csv = await download.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.StartsWith("harbourview-youth-collective-", export.GetProperty("fileName").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-11-12T21:12:00Z"), export.GetProperty("expiresAt").GetDateTimeOffset());
        Assert.Equal("text/csv", download.Content.Headers.ContentType?.MediaType);
        Assert.Contains("9–11,<5", csv);
        Assert.Contains("Marisol Delgado", Query("SELECT ActorName FROM AuditEntries WHERE RecordType = 'ReportExport'"));
    }

    [Fact]
    public async Task An_expired_export_answers_410()
    {
        var export = await (await _factory.ClientFor(Marisol).PostAsJsonAsync("/reports/exports", new { programId = (Guid?)null })).Content.ReadFromJsonAsync<JsonElement>();
        _factory.Clock.Advance(TimeSpan.FromDays(8));

        Assert.Equal(HttpStatusCode.Gone, (await _factory.ClientFor(Marisol).GetAsync($"/reports/exports/{export.GetProperty("id").GetGuid()}")).StatusCode);
    }

    [Fact]
    public async Task Youth_workers_are_refused_and_another_organization_cannot_download()
    {
        var export = await (await _factory.ClientFor(Marisol).PostAsJsonAsync("/reports/exports", new { programId = (Guid?)null })).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).GetAsync("/reports")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).PostAsJsonAsync("/reports/exports", new { programId = (Guid?)null })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/reports/exports/{export.GetProperty("id").GetGuid()}")).StatusCode);
    }

    [Fact]
    public async Task With_Reports_off_the_endpoints_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/reports")).StatusCode);
    }

    private Task CheckIn(Guid child) =>
        _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = child, arrivedAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() });

    private async Task<JsonElement> Get(Guid membership, string path) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

    private static string Band(JsonElement report, string band) =>
        report.GetProperty("ages").EnumerateArray().Single(a => a.GetProperty("band").GetString() == band).GetProperty("count").GetString()!;

    private static int Language(JsonElement report, string language) =>
        report.GetProperty("languages").EnumerateArray().Single(a => a.GetProperty("language").GetString() == language).GetProperty("households").GetInt32();

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
            rows.Add(reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
