using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-077 criteria 1, 2 and 6 (an assignment's brief, its lock, the module's assignments; tenancy, roles and Learning off).
public sealed class LearningAssignmentBriefTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task A_lesson_assignment_is_locked_until_its_lesson_is_done_and_is_listed_on_the_module()
    {
        var assignment = await _c.AssignmentAsync(_c.Knowing, _c.Strengths);

        var locked = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/assignments/{assignment}");
        Assert.Equal(HttpStatusCode.Forbidden, locked.StatusCode);
        var body = await locked.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("locked", body.GetProperty("code").GetString());
        Assert.Equal("Your Strengths", body.GetProperty("unlockAfter").GetString());

        var listed = Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("assignments").EnumerateArray());
        Assert.Equal(assignment, listed.GetProperty("id").GetGuid());
        Assert.Equal("Serve someone this week", listed.GetProperty("title").GetString());
        Assert.Equal(25, listed.GetProperty("totalPoints").GetInt32());
        Assert.Equal("2026-11-19", listed.GetProperty("dueDate").GetString());
        Assert.Equal("locked", listed.GetProperty("status").GetString());
        Assert.Equal("Your Strengths", listed.GetProperty("unlockAfter").GetString());

        await Complete(_c.Strengths);
        var open = Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("assignments").EnumerateArray());
        Assert.Equal("next", open.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, open.GetProperty("submissionId").ValueKind);
    }

    [Fact]
    public async Task The_brief_answers_the_task_ways_to_submit_rubric_due_rules_and_mentor()
    {
        await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/programs/{LearningContent.Tutoring}/youth/{LearningContent.NadiaChild}/mentor", new { mentorId = Daniel });
        var assignment = await _c.AssignmentAsync(_c.Knowing);

        var brief = await Get($"/learning/assignments/{assignment}");

        Assert.Equal("Serve someone this week", brief.GetProperty("title").GetString());
        Assert.Equal(_c.Knowing, brief.GetProperty("moduleId").GetGuid());
        Assert.Equal("Knowing Yourself", brief.GetProperty("moduleTitle").GetString());
        Assert.Equal(JsonValueKind.Null, brief.GetProperty("lessonTitle").ValueKind);
        Assert.StartsWith("Choose one person to serve", brief.GetProperty("brief").GetString());
        Assert.Equal(["Text", "Photo"], brief.GetProperty("submissionTypes").EnumerateArray().Select(t => t.GetString()));
        var rubric = brief.GetProperty("rubric").EnumerateArray().ToList();
        Assert.Equal(3, rubric.Count);
        Assert.Equal("Chose someone and served without being asked", rubric[0].GetProperty("description").GetString());
        Assert.Equal(10, rubric[0].GetProperty("points").GetInt32());
        Assert.Equal(25, brief.GetProperty("totalPoints").GetInt32());
        Assert.Equal("2026-11-19", brief.GetProperty("dueDate").GetString());
        Assert.Equal(2, brief.GetProperty("graceDays").GetInt32());
        Assert.True(brief.GetProperty("allowLate").GetBoolean());
        Assert.Equal("open", brief.GetProperty("dueState").GetString());
        Assert.Equal(14, brief.GetProperty("daysLeft").GetInt32());
        Assert.Equal("Daniel Osei", brief.GetProperty("mentorName").GetString());
        Assert.Equal(JsonValueKind.Null, brief.GetProperty("submission").ValueKind);
    }

    [Fact]
    public async Task Past_the_due_date_and_grace_it_is_late_when_late_work_is_allowed_and_closed_otherwise()
    {
        var late = await _c.AssignmentAsync(_c.Knowing, title: "Late allowed", dueDate: "2026-11-01", graceDays: 2, allowLate: true);
        var closed = await _c.AssignmentAsync(_c.Knowing, title: "No late work", dueDate: "2026-11-01", graceDays: 2, allowLate: false);
        var grace = await _c.AssignmentAsync(_c.Knowing, title: "In the grace period", dueDate: "2026-11-04", graceDays: 2, allowLate: false);

        Assert.Equal("late", (await Get($"/learning/assignments/{late}")).GetProperty("dueState").GetString());
        Assert.Equal("closed", (await Get($"/learning/assignments/{closed}")).GetProperty("dueState").GetString());
        Assert.Equal("open", (await Get($"/learning/assignments/{grace}")).GetProperty("dueState").GetString());
    }

    [Fact]
    public async Task Drafts_other_roles_Learning_off_and_another_organization_are_refused()
    {
        var draft = await _c.AssignmentAsync(_c.Knowing, title: "Draft task", publish: false);
        var assignment = await _c.AssignmentAsync(_c.Knowing);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/assignments/{draft}")).StatusCode);
        Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("assignments").EnumerateArray());
        Assert.DoesNotContain("Draft task", (await Get($"/learning/modules/{_c.Knowing}")).GetRawText());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/assignments/{Guid.NewGuid()}")).StatusCode);
        Assert.Equal("consent-required", (await (await _factory.ClientFor(Sofia).GetAsync($"/learning/assignments/{assignment}")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/learning/assignments/{assignment}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/learning/assignments/{assignment}")).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/assignments/{assignment}")).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/assignments/{assignment}")).StatusCode);
    }

    // Traces to: L2-079 criterion 3 (drafts on a device are kept per membership, so the session names it).
    [Fact]
    public async Task The_session_names_the_active_membership_that_drafts_are_kept_under()
    {
        var me = await Get("/me");

        Assert.Equal(LearningContent.Nadia, me.GetProperty("membershipId").GetGuid());
    }

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private async Task<JsonElement> Get(string path)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _c = await new LearningContent(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
