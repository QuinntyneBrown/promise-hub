using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance tests. Traces to: L2-063 (mentor dashboard and roster), L2-065 criterion 4 (every Mentoring read is scoped to the mentor).
// Daniel mentors Mateo directly, leads Saturday Sports (Kevin, Emily) and supports After-School Tutoring (Mateo, Sofía, Jordan, Yusuf).
public sealed class MentorDashboardTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];
    private static readonly string[] SixYouth = ["Emily Tran", "Jordan Thompson", "Kevin Tran", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"];

    private readonly PromiseHubApiFactory _factory = new();

    // ---- criterion 1: the dashboard counts and lists only the mentor's youth and cohorts

    [Fact]
    public async Task The_dashboard_lists_the_mentors_youth_once_each_with_age_and_programs_and_the_cohorts_on_their_team()
    {
        await AssignDaniel();

        var dashboard = await Get(Daniel, "/mentoring/dashboard");

        var youth = dashboard.GetProperty("youth").EnumerateArray().ToList();
        Assert.Equal(SixYouth, youth.Select(y => y.GetProperty("name").GetString()));
        var mateo = youth.Single(y => y.GetProperty("id").GetGuid() == Mateo);
        Assert.Equal(9, mateo.GetProperty("age").GetInt32());
        Assert.Equal(["After-School Tutoring"], Strings(mateo.GetProperty("programs")));
        var cohorts = dashboard.GetProperty("cohorts").EnumerateArray().ToList();
        Assert.Equal(["After-School Tutoring", "Saturday Sports"], cohorts.Select(c => c.GetProperty("name").GetString()));
        Assert.Equal(["Supporting", "Lead"], cohorts.Select(c => c.GetProperty("role").GetString()));
        Assert.Equal([4, 2], cohorts.Select(c => c.GetProperty("youthCount").GetInt32()));
        Assert.Equal(Sports, cohorts[1].GetProperty("programId").GetGuid());
    }

    // ---- criteria 2 and 3: attendance while Roll Call is on, nothing while it is off

    [Fact]
    public async Task Recent_activity_lists_the_latest_attendance_of_the_mentors_youth_newest_first()
    {
        await AssignDaniel();
        await Post(Jaylen, $"/sessions/{LastNight}/absences", new { childId = Yusuf, clientActionId = Guid.NewGuid() });
        await Post(Jaylen, $"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = "2026-11-05T21:02:00Z", clientActionId = Guid.NewGuid() });

        var dashboard = await Get(Daniel, "/mentoring/dashboard");

        Assert.Equal(1, dashboard.GetProperty("checkedInThisWeek").GetInt32());
        var activity = dashboard.GetProperty("recentActivity").EnumerateArray().ToList();
        Assert.Equal(["Mateo Rivera", "Yusuf Haddad"], activity.Select(a => a.GetProperty("youthName").GetString()));
        Assert.Equal(["CheckedIn", "Absent"], activity.Select(a => a.GetProperty("kind").GetString()));
        Assert.All(activity, a => Assert.Equal("Tutoring night", a.GetProperty("session").GetString()));
    }

    [Fact]
    public async Task With_Roll_Call_off_the_dashboard_sends_no_attendance()
    {
        await AssignDaniel();
        await Post(Jaylen, $"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips", "QuickCards", "Messages", "Incidents", "Reports", "Learning", "Mentoring" } });

        var dashboard = await Get(Daniel, "/mentoring/dashboard");

        Assert.Equal(JsonValueKind.Null, dashboard.GetProperty("checkedInThisWeek").ValueKind);
        Assert.Equal(JsonValueKind.Null, dashboard.GetProperty("recentActivity").ValueKind);
        Assert.Equal(6, dashboard.GetProperty("youth").GetArrayLength());
    }

    // ---- criterion 4: My youth carries age and programs

    [Fact]
    public async Task My_youth_answers_each_youth_with_age_and_programs()
    {
        await AssignDaniel();

        var youth = (await Get(Daniel, "/mentoring/youth")).GetProperty("youth").EnumerateArray().ToList();

        Assert.Equal(SixYouth, youth.Select(y => y.GetProperty("name").GetString()));
        var kevin = youth.Single(y => y.GetProperty("id").GetGuid() == Kevin);
        Assert.Equal(8, kevin.GetProperty("age").GetInt32());
        Assert.Equal(["Saturday Sports"], Strings(kevin.GetProperty("programs")));
    }

    // ---- criterion 5: a mentor with no assignments

    [Fact]
    public async Task A_mentor_with_no_assignments_gets_no_youth_and_no_cohorts()
    {
        var dashboard = await Get(Hana, "/mentoring/dashboard");

        Assert.Empty(dashboard.GetProperty("youth").EnumerateArray());
        Assert.Empty(dashboard.GetProperty("cohorts").EnumerateArray());
        Assert.Equal(0, dashboard.GetProperty("checkedInThisWeek").GetInt32());
        Assert.Empty(dashboard.GetProperty("recentActivity").EnumerateArray());
    }

    // ---- criterion 6: ended enrollments and archived cohorts

    [Fact]
    public async Task An_archived_cohort_and_its_youth_drop_off_unless_a_youth_is_assigned_directly()
    {
        await AssignDaniel();
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/programs/{Tutoring}/archive", new { confirmName = "After-School Tutoring" });

        var dashboard = await Get(Daniel, "/mentoring/dashboard");

        Assert.Equal(["Emily Tran", "Kevin Tran", "Mateo Rivera"], dashboard.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()));
        Assert.Equal(["Saturday Sports"], dashboard.GetProperty("cohorts").EnumerateArray().Select(c => c.GetProperty("name").GetString()));
        Assert.Empty(dashboard.GetProperty("youth").EnumerateArray().Single(y => y.GetProperty("id").GetGuid() == Mateo).GetProperty("programs").EnumerateArray());
    }

    // ---- criterion 7: roles

    [Fact]
    public async Task Staff_youth_and_volunteers_are_refused()
    {
        foreach (var caller in new[] { Marisol, Jaylen, Nadia, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(caller).GetAsync("/mentoring/dashboard")).StatusCode);
        }
    }

    // ---- criterion 8: the Mentoring module

    [Fact]
    public async Task With_Mentoring_off_the_dashboard_answers_404_and_turning_it_on_restores_the_same_youth()
    {
        await AssignDaniel();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync("/mentoring/dashboard")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = (string[])[.. Suite, "Mentoring"] });
        Assert.Equal(6, (await Get(Daniel, "/mentoring/dashboard")).GetProperty("youth").GetArrayLength());
    }

    // ---- criterion 9: tenancy

    [Fact]
    public async Task A_mentor_in_another_organization_never_sees_a_Harbourview_youth_or_cohort()
    {
        await AssignDaniel();
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring" } });

        var dashboard = await Get(Samuel, "/mentoring/dashboard");

        Assert.Empty(dashboard.GetProperty("youth").EnumerateArray());
        Assert.Empty(dashboard.GetProperty("cohorts").EnumerateArray());
        Assert.Empty(dashboard.GetProperty("recentActivity").EnumerateArray());
    }

    private async Task AssignDaniel()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor", new { mentorId = Daniel })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Sports}/mentors", new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = Hana, supportingMentorIds = new[] { Daniel } })).StatusCode);
    }

    private async Task Post(Guid membership, string path, object body)
    {
        var response = await _factory.ClientFor(membership).PostAsJsonAsync(path, body);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
    }

    private static string[] Strings(JsonElement list) => [.. list.EnumerateArray().Select(x => x.GetString() ?? "")];

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
