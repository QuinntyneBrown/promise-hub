using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-089 criteria 3, 5 and 6 (a mentor reads only the shared reflections of his youth, newest first, audited;
// private ones and other youth never; other roles 403; another organization 404; Mentoring or Learning off 404), L2-007.
public sealed class MentorReflectionsTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid LuciaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task Daniel_reads_only_Nadias_shared_reflections_newest_first_and_the_read_is_audited()
    {
        await Save(_w.Content.Strengths, "Thoughtful", "Private words about my week.", shared: false);
        await Complete(_w.Content.Strengths);
        await Save(_w.Content.Values, "Hopeful", "I would stand up for my sister.", shared: true, action: "Ask her how school went.");
        await Complete(_w.Content.Values);
        _factory.Clock.Advance(TimeSpan.FromMinutes(5));
        await Save(_w.Content.Towel, "Challenged", "Serving without being asked is hard.", shared: true);

        var shared = await Shared(MentorReviewWork.Daniel);

        Assert.Equal("Nadia Haddad", shared.GetProperty("name").GetString());
        var items = shared.GetProperty("reflections").EnumerateArray().ToList();
        Assert.Equal(["Pick Up the Towel", "What Matters to You"], items.Select(i => i.GetProperty("lessonTitle").GetString()));
        Assert.Equal("Leading by Serving", items[0].GetProperty("moduleTitle").GetString());
        Assert.Equal("Challenged", items[0].GetProperty("mood").GetString());
        Assert.Equal("I would stand up for my sister.", items[1].GetProperty("text").GetString());
        Assert.Equal("Ask her how school went.", items[1].GetProperty("action").GetString());
        Assert.DoesNotContain("Private words", shared.GetRawText());
        Assert.Single(_w.Query("SELECT Summary FROM AuditEntries WHERE Action = 'Viewed' AND RecordType = 'Child' AND Summary LIKE '%shared reflections%'"));
    }

    [Fact]
    public async Task Saving_with_sharing_off_takes_a_reflection_back_from_her_mentor()
    {
        await Save(_w.Content.Strengths, "Unsure", "At first I shared this.", shared: true);
        Assert.Single((await Shared(MentorReviewWork.Daniel)).GetProperty("reflections").EnumerateArray());

        await Save(_w.Content.Strengths, "Unsure", "Now it is mine again.", shared: false);

        Assert.Empty((await Shared(MentorReviewWork.Daniel)).GetProperty("reflections").EnumerateArray());
    }

    [Fact]
    public async Task Another_mentor_other_roles_another_organization_and_modules_off_are_refused()
    {
        await Save(_w.Content.Strengths, "Hopeful", "Shared with Daniel only.", shared: true);
        var path = $"/mentoring/youth/{LearningContent.NadiaChild}/reflections";

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(MentorReviewWork.Hana).GetAsync(path)).StatusCode);
        Assert.Single(_w.Query("SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Child'"));
        foreach (var who in new[] { LearningContent.Marisol, LearningContent.Tom, LearningContent.Nadia, Jaylen })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync(path)).StatusCode);
        }
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/youth/{LuciaChild}/reflections")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/youth/{Guid.NewGuid()}/reflections")).StatusCode);

        await _factory.ClientFor(DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example"))
            .PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Learning", "Mentoring" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Samuel).GetAsync(path)).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Learning" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync(path)).StatusCode);
        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Mentoring" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync(path)).StatusCode);
    }

    private async Task Save(Guid lesson, string mood, string text, bool shared, string? action = null)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/lessons/{lesson}/reflection", new { mood, text, action, shared });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task Complete(Guid lesson) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{lesson}/complete", null)).StatusCode);

    private async Task<JsonElement> Shared(Guid mentor)
    {
        var response = await _factory.ClientFor(mentor).GetAsync($"/mentoring/youth/{LearningContent.NadiaChild}/reflections");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
