using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-068 (Learning home, tracks and modules with gating enforced on the server), L2-056 and L2-060 (the gates answer first).
public sealed class LearningBrowseTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task Home_lists_her_followed_track_with_progress_and_the_first_lesson_to_do()
    {
        var home = await Get(LearningContent.Nadia, "/learning/home");

        Assert.Equal(0, home.GetProperty("completedLessons").GetInt32());
        Assert.Equal(4, home.GetProperty("totalLessons").GetInt32());
        var next = home.GetProperty("next");
        Assert.Equal(_c.Strengths, next.GetProperty("lessonId").GetGuid());
        Assert.Equal("Knowing Yourself", next.GetProperty("moduleTitle").GetString());
        Assert.Equal("Reading", next.GetProperty("kind").GetString());
        var track = Assert.Single(home.GetProperty("tracks").EnumerateArray());
        Assert.Equal("Leadership Foundations", track.GetProperty("name").GetString());
        Assert.Equal("After-School Tutoring", track.GetProperty("program").GetString());
        Assert.Equal(4, track.GetProperty("totalLessons").GetInt32());
    }

    [Fact]
    public async Task A_track_lists_only_published_modules_in_order_with_a_locked_module_naming_what_unlocks_it()
    {
        var track = await Get(LearningContent.Nadia, $"/learning/tracks/{_c.Leadership}");

        var modules = track.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.Equal("not-started", modules[0].GetProperty("status").GetString());
        Assert.Equal(2, modules[0].GetProperty("lessonCount").GetInt32());
        Assert.Equal("locked", modules[1].GetProperty("status").GetString());
        Assert.Equal("Knowing Yourself", modules[1].GetProperty("unlockAfter").GetString());
        Assert.Equal(["Leadership Foundations"], track.GetProperty("tracks").EnumerateArray().Select(t => t.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task A_module_lists_published_lessons_in_order_and_later_lessons_and_locked_modules_are_refused()
    {
        var module = await Get(LearningContent.Nadia, $"/learning/modules/{_c.Knowing}");

        var lessons = module.GetProperty("lessons").EnumerateArray().ToList();
        Assert.Equal(["Your Strengths", "What Matters to You"], lessons.Select(l => l.GetProperty("title").GetString()));
        Assert.Equal("next", lessons[0].GetProperty("status").GetString());
        Assert.Equal("locked", lessons[1].GetProperty("status").GetString());
        Assert.Equal("Your Strengths", lessons[1].GetProperty("unlockAfter").GetString());
        Assert.Equal("Leadership Foundations", module.GetProperty("trackName").GetString());

        var locked = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/modules/{_c.Serving}");
        Assert.Equal(HttpStatusCode.Forbidden, locked.StatusCode);
        var body = await locked.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("locked", body.GetProperty("code").GetString());
        Assert.Equal("Knowing Yourself", body.GetProperty("unlockAfter").GetString());
    }

    [Fact]
    public async Task Drafts_unfollowed_tracks_and_unknown_ids_are_not_found()
    {
        foreach (var path in new[] { $"/learning/tracks/{_c.Digital}", $"/learning/modules/{_c.Speaking}", $"/learning/tracks/{Guid.NewGuid()}", $"/learning/modules/{Guid.NewGuid()}" })
        {
            Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync(path)).StatusCode);
        }

        await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/curriculum/tracks/{_c.Leadership}/cohorts", new { programIds = Array.Empty<Guid>() });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/tracks/{_c.Leadership}")).StatusCode);
        Assert.Empty((await Get(LearningContent.Nadia, "/learning/home")).GetProperty("tracks").EnumerateArray());
    }

    [Fact]
    public async Task The_consent_gate_other_roles_and_Learning_off_answer_before_anything_is_read()
    {
        var sofia = await _factory.ClientFor(Sofia).GetAsync("/learning/home");
        Assert.Equal(HttpStatusCode.Forbidden, sofia.StatusCode);
        Assert.Equal("consent-required", (await sofia.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        foreach (var who in new[] { Daniel, LearningContent.Marisol })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/learning/home")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/learning/tracks/{_c.Leadership}")).StatusCode);
        }

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        foreach (var path in new[] { "/learning/home", $"/learning/tracks/{_c.Leadership}", $"/learning/modules/{_c.Knowing}" })
        {
            Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync(path)).StatusCode);
        }
    }

    [Fact]
    public async Task Another_organizations_youth_sees_none_of_Harbourviews_curriculum()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        var kidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{kidsClub}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });

        var home = await Get(Lucia, "/learning/home");

        Assert.Empty(home.GetProperty("tracks").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, home.GetProperty("next").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/tracks/{_c.Leadership}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/modules/{_c.Knowing}")).StatusCode);
    }

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _c = await new LearningContent(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
