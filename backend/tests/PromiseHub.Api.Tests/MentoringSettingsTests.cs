using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-125 criteria 1 to 5, L2-063, L2-065, L2-005, L2-007, L2-001, L2-032
// Description: while Mentoring is on, admins choose how often mentors check in (7, 14, 21 or 30 days, 14 by default); each mentor's
// dashboard lists his youth with no mentor check-in from him within that many days, never-checked-in first, then the oldest.
// Today is Thu 5 Nov 2026. Daniel mentors Mateo directly, leads Saturday Sports (Kevin, Emily) and supports After-School Tutoring
// (Mateo, Sofía, Jordan, Yusuf), which Hana leads.
public sealed class MentoringSettingsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Mentors_check_in_every_14_days_until_changed()
    {
        var settings = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/mentoring");

        Assert.Equal(14, settings.GetProperty("checkInEveryDays").GetInt32());
    }

    [Fact]
    public async Task A_program_director_saves_7_14_21_or_30_days_and_the_change_is_audited()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await Save(Marisol, 7)).StatusCode);

        Assert.Equal(7, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/mentoring")).GetProperty("checkInEveryDays").GetInt32());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'MentoringSettings' AND Action = 'Updated'"));
        foreach (var days in new[] { 14, 21, 30 })
        {
            Assert.Equal(HttpStatusCode.NoContent, (await Save(Tom, days)).StatusCode);
        }
    }

    [Fact]
    public async Task Any_other_cadence_is_refused_and_nothing_changes()
    {
        var invalid = await Save(Tom, 10);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        Assert.Equal("Choose 7, 14, 21 or 30 days.",
            (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("checkInEveryDays").GetString());
        Assert.Equal(14, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/mentoring")).GetProperty("checkInEveryDays").GetInt32());
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'MentoringSettings'"));
    }

    [Fact]
    public async Task With_Mentoring_off_both_answer_404_and_other_roles_get_403()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync("/settings/mentoring")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Grace, 7)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/mentoring")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Daniel, 7)).StatusCode);
    }

    [Fact]
    public async Task Harbourviews_cadence_never_changes_another_organizations()
    {
        await Save(Tom, 7);
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring" } });

        Assert.Equal(14, (await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/mentoring")).GetProperty("checkInEveryDays").GetInt32());
    }

    [Fact]
    public async Task The_dashboard_lists_youth_without_a_mentor_check_in_from_him_within_the_cadence()
    {
        await AssignDaniel();
        await Log(Daniel, Mateo, "2026-11-01");
        await Log(Daniel, Jordan, "2026-10-20");
        await Log(Daniel, Kevin, "2026-10-22");
        await Log(Hana, Sofia, "2026-11-04");

        var dashboard = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/mentoring/dashboard");

        Assert.Equal(14, dashboard.GetProperty("checkInEveryDays").GetInt32());
        var due = dashboard.GetProperty("checkInsDue").EnumerateArray().ToList();
        Assert.Equal(["Emily Tran", "Sofía Rivera", "Yusuf Haddad", "Jordan Thompson", "Kevin Tran"], due.Select(d => d.GetProperty("youthName").GetString()));
        Assert.Equal(JsonValueKind.Null, due[0].GetProperty("lastCheckIn").ValueKind);
        Assert.Equal("2026-10-20", due[3].GetProperty("lastCheckIn").GetString());
        Assert.Equal(Jordan, due[3].GetProperty("childId").GetGuid());
    }

    [Fact]
    public async Task A_new_cadence_changes_what_the_dashboard_counts_as_due()
    {
        await AssignDaniel();
        await Log(Daniel, Jordan, "2026-10-20");
        await Save(Tom, 30);

        var dashboard = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/mentoring/dashboard");

        Assert.Equal(30, dashboard.GetProperty("checkInEveryDays").GetInt32());
        Assert.DoesNotContain("Jordan Thompson", dashboard.GetProperty("checkInsDue").EnumerateArray().Select(d => d.GetProperty("youthName").GetString()));
    }

    private Task<HttpResponseMessage> Save(Guid membership, int days) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/mentoring", new { checkInEveryDays = days });

    private async Task AssignDaniel()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor", new { mentorId = Daniel })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Sports}/mentors", new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = Hana, supportingMentorIds = new[] { Daniel } })).StatusCode);
    }

    private async Task Log(Guid mentor, Guid child, string date)
    {
        var response = await _factory.ClientFor(mentor).PostAsJsonAsync("/mentoring/check-ins", new
        {
            childId = child,
            date,
            kind = "OneToOne",
            engagement = "Steady",
            topics = (string?)null,
            actionItems = (string?)null,
            privateNotes = (string?)null,
            followUpOn = (string?)null,
            shared = false,
            guardianInformed = false,
        });
        Assert.True(response.IsSuccessStatusCode, $"check-in answered {response.StatusCode}");
    }

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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
