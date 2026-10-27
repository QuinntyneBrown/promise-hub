using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-087 criteria 4 to 8 (badges earned with when and who, badges still to unlock with what earns them and how far,
// only the badges she can earn, milestones and next up, counts that agree with the journey, the empty state, gates, roles, tenancy, Learning off).
public sealed class LearningBadgesTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task Earned_badges_show_when_and_who_and_locked_badges_show_what_earns_them_and_how_far()
    {
        var first = await Badge("First Steps", "LessonCompleted", _w.Content.Strengths, "Finished a first lesson.");
        var knows = await Badge("Knows Themselves", "ModuleCompleted", _w.Content.Knowing, null);
        var served = await Badge("Served Someone", "AssignmentAccepted", _w.Assignment, null);
        var speaks = await ByHand("Speaks Up");
        var encourager = await ByHand("Encourager");
        await Complete(_w.Content.Strengths);
        _factory.Clock.Advance(TimeSpan.FromHours(1));
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync($"/curriculum/badges/{speaks}/awards", new { membershipId = LearningContent.Nadia })).StatusCode);

        var badges = await Get(LearningContent.Nadia, "/learning/badges");

        var earned = badges.GetProperty("earned").EnumerateArray().ToList();
        Assert.Equal([first, speaks], earned.Select(b => b.GetProperty("id").GetGuid()));
        Assert.Equal("Finished a first lesson.", earned[0].GetProperty("description").GetString());
        Assert.Equal(JsonValueKind.Null, earned[0].GetProperty("awardedBy").ValueKind);
        Assert.Equal("Marisol Delgado", earned[1].GetProperty("awardedBy").GetString());
        Assert.True(earned[0].GetProperty("awardedAt").GetDateTimeOffset() < earned[1].GetProperty("awardedAt").GetDateTimeOffset());
        var locked = badges.GetProperty("locked").EnumerateArray().ToList();
        Assert.Equal([knows, served, encourager], locked.Select(b => b.GetProperty("id").GetGuid()));
        Assert.Equal("Finish Knowing Yourself.", locked[0].GetProperty("description").GetString());
        Assert.Equal("ModuleCompleted", locked[0].GetProperty("rule").GetString());
        Assert.Equal(1, locked[0].GetProperty("completed").GetInt32());
        Assert.Equal(2, locked[0].GetProperty("total").GetInt32());
        Assert.Equal("Have Serve someone this week accepted.", locked[1].GetProperty("description").GetString());
        Assert.Equal(0, locked[1].GetProperty("completed").GetInt32());
        Assert.Equal(1, locked[1].GetProperty("total").GetInt32());
        Assert.Equal("Your program team awards it by hand.", locked[2].GetProperty("description").GetString());
        Assert.Equal(JsonValueKind.Null, locked[2].GetProperty("total").ValueKind);

        var journey = (await Get(LearningContent.Nadia, "/learning/journey")).GetProperty("badges");
        Assert.Equal(2, journey.GetProperty("earned").GetInt32());
        Assert.Equal(5, journey.GetProperty("total").GetInt32());
        Assert.Equal([true, true, false, false, false], journey.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("earned").GetBoolean()));
    }

    [Fact]
    public async Task Only_badges_she_can_earn_are_listed_and_a_badge_deleted_after_she_earned_it_stays_earned()
    {
        var early = await Badge("Early Bird", "LessonCompleted", _w.Content.Strengths, null);
        var draft = await Badge("Finds Their Voice", "LessonCompleted", _w.Content.Voice, null);
        var gone = await Badge("Gone", "LessonCompleted", _w.Content.Values, null);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(LearningContent.Marisol).DeleteAsync($"/curriculum/badges/{gone}")).StatusCode);
        await Complete(_w.Content.Strengths);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(LearningContent.Marisol).DeleteAsync($"/curriculum/badges/{early}")).StatusCode);

        var badges = await Get(LearningContent.Nadia, "/learning/badges");

        Assert.Equal([early], badges.GetProperty("earned").EnumerateArray().Select(b => b.GetProperty("id").GetGuid()));
        Assert.Empty(badges.GetProperty("locked").EnumerateArray());
        _ = draft;
    }

    [Fact]
    public async Task Milestones_list_when_she_joined_each_badge_in_order_and_the_badge_she_is_closest_to()
    {
        await Badge("First Steps", "LessonCompleted", _w.Content.Strengths, null);
        await Badge("Knows Themselves", "ModuleCompleted", _w.Content.Knowing, null);
        await Badge("Quick Learner", "LessonCompleted", _w.Content.Values, null);
        await ByHand("Speaks Up");
        await Complete(_w.Content.Strengths);

        var milestones = (await Get(LearningContent.Nadia, "/learning/badges")).GetProperty("milestones").EnumerateArray().ToList();

        Assert.Equal(["joined", "badge", "next"], milestones.Select(m => m.GetProperty("kind").GetString()));
        Assert.Equal("Joined After-School Tutoring", milestones[0].GetProperty("title").GetString());
        Assert.Equal("First Steps badge", milestones[1].GetProperty("title").GetString());
        Assert.Equal("Next up: Knows Themselves", milestones[2].GetProperty("title").GetString());
        Assert.Equal(JsonValueKind.Null, milestones[2].GetProperty("at").ValueKind);
    }

    [Fact]
    public async Task With_nothing_earned_every_badge_is_still_to_unlock()
    {
        await Badge("First Steps", "LessonCompleted", _w.Content.Strengths, null);

        var badges = await Get(LearningContent.Nadia, "/learning/badges");

        Assert.Empty(badges.GetProperty("earned").EnumerateArray());
        Assert.Single(badges.GetProperty("locked").EnumerateArray());
    }

    [Fact]
    public async Task The_consent_gate_other_roles_and_Learning_off_answer_before_anything_is_read()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/learning/badges")).StatusCode);
        foreach (var who in new[] { MentorReviewWork.Daniel, LearningContent.Marisol })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/learning/badges")).StatusCode);
        }

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync("/learning/badges")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_youth_never_sees_Harbourviews_badges()
    {
        await ByHand("Speaks Up");
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        var kidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{kidsClub}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });

        var badges = await Get(Lucia, "/learning/badges");

        Assert.Empty(badges.GetProperty("earned").EnumerateArray());
        Assert.Empty(badges.GetProperty("locked").EnumerateArray());
    }

    private async Task<Guid> Badge(string name, string rule, Guid target, string? description) =>
        await Created(await _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync("/curriculum/badges",
            new { name, icon = "star", description, kind = "Automatic", rule, targetId = target }));

    private async Task<Guid> ByHand(string name) =>
        await Created(await _factory.ClientFor(LearningContent.Marisol).PostAsJsonAsync("/curriculum/badges", new { name, icon = "flag", kind = "Manual" }));

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
