using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-132 criteria 1, 3 and 4, L2-133 criteria 1 to 4 and 7, L2-005, L2-001
// Description: GET /website/{slug}/content answers a visitor, with no session, the organization's current programs with the enrollment link
// while open, published tracks and modules with their badge while Learning is on, the mentorship model and lead mentors' first names while
// Mentoring is on, and counts of programs and content only; 404 for an unknown address, a suspended organization or the module off.
public sealed class PublicContentTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly string[] Northgate = ["Roster", "RollCall", "QuickCards"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_visitor_reads_the_current_programs_with_the_enrollment_link_while_open_and_no_people()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        var link = await OpenEnrollment(Tom, Tutoring);

        var content = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/website/harbourview/content");

        var programs = content.GetProperty("programs").EnumerateArray().ToList();
        Assert.Equal(["After-School Tutoring", "Saturday Sports", "Winter Camp 2026"], programs.Select(p => p.GetProperty("name").GetString()));
        var tutoring = programs[0];
        Assert.Equal("Mon–Thu, 4–6 pm", tutoring.GetProperty("schedule").GetString());
        Assert.Equal("6–13", tutoring.GetProperty("ages").GetString());
        Assert.Equal("2026-09-08", tutoring.GetProperty("startsOn").GetString());
        Assert.Equal("2027-06-24", tutoring.GetProperty("endsOn").GetString());
        Assert.Equal("Running", tutoring.GetProperty("status").GetString());
        Assert.Equal(new Uri(link).AbsolutePath, tutoring.GetProperty("applyPath").GetString());
        Assert.Equal(JsonValueKind.Null, programs[1].GetProperty("applyPath").ValueKind);
        Assert.Equal("Upcoming", programs[2].GetProperty("status").GetString());
        Assert.Equal(["name", "schedule", "ages", "startsOn", "endsOn", "status", "applyPath", "track", "leadMentor"], tutoring.EnumerateObject().Select(p => p.Name));
        var impact = content.GetProperty("impact");
        Assert.Equal(3, impact.GetProperty("programs").GetInt32());
        Assert.Equal(1, impact.GetProperty("open").GetInt32());
        var raw = await _factory.CreateClient().GetStringAsync("/website/harbourview/content");
        Assert.DoesNotContain("Summer Camp", raw);
        Assert.DoesNotContain("Mateo", raw);
        Assert.DoesNotContain("capacity", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task While_Learning_and_Mentoring_are_on_published_tracks_badges_and_lead_mentors_show_and_drafts_never_do()
    {
        await Modules(Tom, [.. Suite, "Learning", "Mentoring", "PublicWebsite"]);
        var learning = await new LearningContent(_factory).BuildAsync();
        Assert.True((await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/badges",
            new { name = "First Steps", icon = "star", description = (string?)null, kind = "Automatic", rule = "ModuleCompleted", targetId = learning.Knowing, competencyId = (Guid?)null })).IsSuccessStatusCode);
        Assert.True((await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() })).IsSuccessStatusCode);

        var content = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/website/harbourview/content");

        var tracks = content.GetProperty("tracks").EnumerateArray().ToList();
        var track = Assert.Single(tracks);
        Assert.Equal("Leadership Foundations", track.GetProperty("name").GetString());
        Assert.Equal("Growing as a leader at home, at school and in the cohort.", track.GetProperty("description").GetString());
        var modules = track.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.Equal("First Steps", modules[0].GetProperty("badge").GetString());
        Assert.Equal(JsonValueKind.Null, modules[1].GetProperty("badge").ValueKind);
        var tutoring = content.GetProperty("programs").EnumerateArray().First();
        Assert.Equal("Leadership Foundations", tutoring.GetProperty("track").GetString());
        Assert.Equal("Daniel", tutoring.GetProperty("leadMentor").GetString());
        Assert.True(content.GetProperty("mentorship").GetBoolean());
        Assert.Equal(1, content.GetProperty("impact").GetProperty("tracks").GetInt32());
        Assert.Equal(2, content.GetProperty("impact").GetProperty("modules").GetInt32());
        var raw = await _factory.CreateClient().GetStringAsync("/website/harbourview/content");
        Assert.DoesNotContain("Digital Skills", raw);
        Assert.DoesNotContain("Speaking Up", raw);
        Assert.DoesNotContain("Osei", raw);
        Assert.DoesNotContain("Your Strengths", raw);
    }

    [Fact]
    public async Task While_Learning_and_Mentoring_are_off_no_track_badge_mentor_or_learning_count_is_answered()
    {
        await Modules(Tom, [.. Suite, "Learning", "Mentoring", "PublicWebsite"]);
        await new LearningContent(_factory).BuildAsync();
        Assert.True((await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = Daniel, supportingMentorIds = Array.Empty<Guid>() })).IsSuccessStatusCode);
        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var content = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/website/harbourview/content");

        Assert.Empty(content.GetProperty("tracks").EnumerateArray());
        Assert.False(content.GetProperty("mentorship").GetBoolean());
        var tutoring = content.GetProperty("programs").EnumerateArray().First();
        Assert.Equal(JsonValueKind.Null, tutoring.GetProperty("track").ValueKind);
        Assert.Equal(JsonValueKind.Null, tutoring.GetProperty("leadMentor").ValueKind);
        Assert.Equal(JsonValueKind.Null, content.GetProperty("impact").GetProperty("tracks").ValueKind);
        Assert.Equal(JsonValueKind.Null, content.GetProperty("impact").GetProperty("modules").ValueKind);
    }

    [Fact]
    public async Task Each_organization_answers_only_its_own_programs()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        await Modules(Grace, [.. Northgate, "PublicWebsite"]);
        await OpenEnrollment(Grace, KidsClub);

        var visitor = _factory.CreateClient();
        var northgate = await visitor.GetFromJsonAsync<JsonElement>("/website/northgate/content");
        var harbourview = await visitor.GetStringAsync("/website/harbourview/content");

        Assert.Equal(["Kids Club"], northgate.GetProperty("programs").EnumerateArray().Select(p => p.GetProperty("name").GetString()));
        Assert.DoesNotContain("Kids Club", harbourview);
        Assert.DoesNotContain("Tutoring", northgate.GetRawText());
    }

    [Fact]
    public async Task An_unknown_address_a_suspended_organization_and_the_module_off_all_answer_404_with_no_body()
    {
        var visitor = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/harbourview/content")).StatusCode);

        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        Assert.Equal(HttpStatusCode.OK, (await visitor.GetAsync("/website/harbourview/content")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/nowhere/content")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/northgate/content")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Harbourview}/suspend", new { reason = "Unpaid" })).StatusCode);
        var suspended = await visitor.GetAsync("/website/harbourview/content");
        Assert.Equal(HttpStatusCode.NotFound, suspended.StatusCode);
        Assert.Equal(0, suspended.Content.Headers.ContentLength ?? 0);
    }

    private async Task Modules(Guid admin, string[] on) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(admin).PutAsJsonAsync("/settings/modules", new { on })).StatusCode);

    private async Task<string> OpenEnrollment(Guid admin, Guid program)
    {
        var opened = await _factory.ClientFor(admin).PostAsync($"/programs/{program}/enrollment/open", null);
        Assert.Equal(HttpStatusCode.OK, opened.StatusCode);
        return (await opened.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
