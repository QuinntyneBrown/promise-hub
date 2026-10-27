using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-087 criteria 1 to 3, 6 and 8 (the journey: overall progress counted as on Learning, the roadmap of followed
// tracks with module states, the current module, the weekly streak, the stage from the latest assessments, gates, roles, tenancy, Learning off).
public sealed class LearningJourneyTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task The_journey_counts_lessons_as_Learning_does_and_lists_each_followed_track_with_its_modules_in_order()
    {
        await Complete(_w.Content.Strengths);

        var journey = await Journey(LearningContent.Nadia);
        var home = await Get(LearningContent.Nadia, "/learning/home");

        Assert.Equal(home.GetProperty("completedLessons").GetInt32(), journey.GetProperty("completedLessons").GetInt32());
        Assert.Equal(home.GetProperty("totalLessons").GetInt32(), journey.GetProperty("totalLessons").GetInt32());
        Assert.Equal(1, journey.GetProperty("completedLessons").GetInt32());
        Assert.Equal(4, journey.GetProperty("totalLessons").GetInt32());
        var track = Assert.Single(journey.GetProperty("tracks").EnumerateArray());
        Assert.Equal("Leadership Foundations", track.GetProperty("name").GetString());
        var modules = track.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.Equal("in-progress", modules[0].GetProperty("status").GetString());
        Assert.Equal(1, modules[0].GetProperty("completedLessons").GetInt32());
        Assert.Equal("locked", modules[1].GetProperty("status").GetString());
        Assert.Equal("Knowing Yourself", modules[1].GetProperty("unlockAfter").GetString());
        var current = journey.GetProperty("current");
        Assert.Equal(_w.Content.Knowing, current.GetProperty("moduleId").GetGuid());
        Assert.Equal("Knowing Yourself", current.GetProperty("moduleTitle").GetString());
    }

    [Fact]
    public async Task The_streak_counts_weeks_in_a_row_with_a_lesson_from_this_week_or_last_week_and_a_week_without_one_ends_it()
    {
        Assert.Equal(0, (await Journey(LearningContent.Nadia)).GetProperty("streakWeeks").GetInt32());

        await Complete(_w.Content.Strengths);
        Assert.Equal(1, (await Journey(LearningContent.Nadia)).GetProperty("streakWeeks").GetInt32());

        _factory.Clock.Advance(TimeSpan.FromDays(7));
        await Complete(_w.Content.Values);
        _factory.Clock.Advance(TimeSpan.FromDays(7));
        Assert.Equal(2, (await Journey(LearningContent.Nadia)).GetProperty("streakWeeks").GetInt32());

        await Complete(_w.Content.Towel);
        Assert.Equal(3, (await Journey(LearningContent.Nadia)).GetProperty("streakWeeks").GetInt32());

        _factory.Clock.Advance(TimeSpan.FromDays(14));
        Assert.Equal(0, (await Journey(LearningContent.Nadia)).GetProperty("streakWeeks").GetInt32());
    }

    [Fact]
    public async Task The_first_stage_whose_competencies_are_not_all_proficient_is_where_she_is()
    {
        var stages = (await Journey(LearningContent.Nadia)).GetProperty("stages").EnumerateArray().ToList();
        Assert.Equal(["Explorer", "Contributor", "Leader"], stages.Select(s => s.GetProperty("name").GetString()));
        Assert.Equal(["current", "ahead", "ahead"], stages.Select(s => s.GetProperty("status").GetString()));
        Assert.Equal(["Serves others", "Works with others"], stages[0].GetProperty("competencies").EnumerateArray().Select(c => c.GetString()));

        await Assess(("Serves others", "Proficient"), ("Works with others", "Mastered"), ("Speaks up", "Developing"));

        stages = (await Journey(LearningContent.Nadia)).GetProperty("stages").EnumerateArray().ToList();
        Assert.Equal(["earned", "current", "ahead"], stages.Select(s => s.GetProperty("status").GetString()));
        Assert.Equal(2, stages[0].GetProperty("proficient").GetInt32());
        Assert.Equal(0, stages[1].GetProperty("proficient").GetInt32());

        await Assess(("Works with others", "Developing"));

        stages = (await Journey(LearningContent.Nadia)).GetProperty("stages").EnumerateArray().ToList();
        Assert.Equal(["current", "ahead", "ahead"], stages.Select(s => s.GetProperty("status").GetString()));
    }

    [Fact]
    public async Task With_no_track_published_for_her_programs_the_journey_is_empty()
    {
        await _factory.ClientFor(LearningContent.Marisol).PutAsJsonAsync($"/curriculum/tracks/{_w.Content.Leadership}/cohorts", new { programIds = Array.Empty<Guid>() });

        var journey = await Journey(LearningContent.Nadia);

        Assert.Empty(journey.GetProperty("tracks").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, journey.GetProperty("current").ValueKind);
        Assert.Equal(0, journey.GetProperty("totalLessons").GetInt32());
    }

    [Fact]
    public async Task The_consent_gate_other_roles_and_Learning_off_answer_before_anything_is_read()
    {
        var sofia = await _factory.ClientFor(Sofia).GetAsync("/learning/journey");
        Assert.Equal(HttpStatusCode.Forbidden, sofia.StatusCode);
        Assert.Equal("consent-required", (await sofia.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        foreach (var who in new[] { MentorReviewWork.Daniel, LearningContent.Marisol, LearningContent.Tom })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/learning/journey")).StatusCode);
        }

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync("/learning/journey")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_youth_sees_only_her_own_organizations_tracks_and_stages()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        var kidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{kidsClub}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        await Assess(("Serves others", "Mastered"), ("Works with others", "Mastered"));

        var journey = await Journey(Lucia);

        Assert.Empty(journey.GetProperty("tracks").EnumerateArray());
        Assert.Equal(["Explorer", "Contributor"], journey.GetProperty("stages").EnumerateArray().Select(s => s.GetProperty("name").GetString()));
        Assert.Equal("current", journey.GetProperty("stages")[0].GetProperty("status").GetString());
    }

    private async Task Assess(params (string Name, string Level)[] items)
    {
        var response = await _factory.ClientFor(MentorReviewWork.Daniel).PutAsJsonAsync($"/mentoring/youth/{LearningContent.NadiaChild}/competencies", new
        {
            items = items.Select(i => new { competencyId = DatabaseSeeder.CompetencyId(DatabaseSeeder.Harbourview, i.Name), level = i.Level, notes = (string?)null }).ToArray(),
        });
        Assert.True(response.IsSuccessStatusCode, $"assess answered {response.StatusCode}");
    }

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private Task<JsonElement> Journey(Guid membership) => Get(membership, "/learning/journey");

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
