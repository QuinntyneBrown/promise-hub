using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance tests. Traces to: L2-065 (role-scoped data visibility for mentors): the cohort page of a cohort the mentor leads or supports.
public sealed class MentorCohortTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Winter = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];

    private readonly PromiseHubApiFactory _factory = new();

    // ---- criterion 1: a cohort the mentor is on

    [Fact]
    public async Task A_supporting_mentor_reads_the_cohorts_term_schedule_team_and_roster_with_each_youths_mentor()
    {
        await Team(Tutoring, Hana, Daniel);
        await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor", new { mentorId = Daniel });

        var cohort = await Get(Daniel, $"/mentoring/cohorts/{Tutoring}");

        Assert.Equal("After-School Tutoring", cohort.GetProperty("name").GetString());
        Assert.Equal("Mon–Thu, 4–6 pm", cohort.GetProperty("schedule").GetString());
        Assert.Equal("Supporting", cohort.GetProperty("role").GetString());
        Assert.Equal("Hana Kim", cohort.GetProperty("lead").GetString());
        Assert.Equal(["Daniel Osei"], cohort.GetProperty("supporting").EnumerateArray().Select(s => s.GetString()));
        var members = cohort.GetProperty("members").EnumerateArray().ToList();
        Assert.Equal(["Jordan Thompson", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"], members.Select(m => m.GetProperty("name").GetString()));
        var mateo = members.Single(m => m.GetProperty("id").GetGuid() == Mateo);
        Assert.Equal("Daniel Osei", mateo.GetProperty("mentor").GetString());
        Assert.Equal(9, mateo.GetProperty("age").GetInt32());
        Assert.Equal(JsonValueKind.Null, members[0].GetProperty("mentor").ValueKind);
        Assert.False(members[0].TryGetProperty("dateOfBirth", out _));
    }

    // ---- criterion 2: a cohort the mentor is not on, archived, another organization's

    [Fact]
    public async Task A_cohort_the_mentor_is_not_on_or_an_archived_one_answers_403_and_is_audited()
    {
        await Team(Tutoring, Hana, Daniel);

        var notOn = await _factory.ClientFor(Daniel).GetAsync($"/mentoring/cohorts/{Sports}");
        Assert.Equal(HttpStatusCode.Forbidden, notOn.StatusCode);
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Program' AND RecordId = '{Sports.ToString().ToUpperInvariant()}'"));

        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/programs/{Tutoring}/archive", new { confirmName = "After-School Tutoring" });
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/cohorts/{Tutoring}")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_program_or_an_unknown_id_answers_404()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/cohorts/{KidsClub}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/cohorts/{Guid.NewGuid()}")).StatusCode);
    }

    // ---- criterion 3: a cohort with nobody enrolled

    [Fact]
    public async Task A_cohort_the_mentor_leads_with_nobody_enrolled_has_no_members()
    {
        await Team(Winter, Daniel);

        var cohort = await Get(Daniel, $"/mentoring/cohorts/{Winter}");

        Assert.Equal("Lead", cohort.GetProperty("role").GetString());
        Assert.Empty(cohort.GetProperty("members").EnumerateArray());
    }

    // ---- criterion 5: roles and the module

    [Fact]
    public async Task Other_roles_get_403_and_with_Mentoring_off_the_cohort_answers_404()
    {
        await Team(Tutoring, Daniel);

        foreach (var caller in new[] { Marisol, Jaylen, Nadia, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(caller).GetAsync($"/mentoring/cohorts/{Tutoring}")).StatusCode);
        }

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/cohorts/{Tutoring}")).StatusCode);
    }

    private async Task Team(Guid program, Guid lead, params Guid[] supporting) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{program}/mentors", new { leadMentorId = lead, supportingMentorIds = supporting })).StatusCode);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
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
            rows.Add(reader.GetValue(0).ToString() ?? "");
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
