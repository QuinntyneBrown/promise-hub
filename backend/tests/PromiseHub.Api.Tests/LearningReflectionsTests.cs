using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-089 criteria 1 to 4 and 7 (a youth's reflection on a lesson: the editor, saving with its checks, private by
// default, one row per youth and lesson, audited without her words, the lesson, consent and role gates, tenancy and Learning off).
public sealed class LearningReflectionsTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private const string Words = "My little brother cleared the table after dinner without anyone asking. I want to be the one who notices first.";

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task The_editor_answers_the_lesson_its_prompts_and_her_mentor_with_no_reflection_yet()
    {
        var editor = await Get($"/learning/lessons/{_w.Content.Strengths}/reflection");

        Assert.Equal(_w.Content.Strengths, editor.GetProperty("lessonId").GetGuid());
        Assert.Equal("Your Strengths", editor.GetProperty("lessonTitle").GetString());
        Assert.Equal("Knowing Yourself", editor.GetProperty("moduleTitle").GetString());
        Assert.Equal(["Who picked up the towel for you?"], editor.GetProperty("prompts").EnumerateArray().Select(p => p.GetString()));
        Assert.Equal("Daniel Osei", editor.GetProperty("mentorName").GetString());
        Assert.Equal(JsonValueKind.Null, editor.GetProperty("reflection").ValueKind);
    }

    [Fact]
    public async Task Saving_keeps_one_private_reflection_per_lesson_replaces_it_after_and_audits_it_without_her_words()
    {
        var first = await Save(_w.Content.Strengths, new { mood = "Thoughtful", text = Words, action = "Pack my own lunch on Thursday.", shared = false });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var saved = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Thoughtful", saved.GetProperty("mood").GetString());
        Assert.False(saved.GetProperty("shared").GetBoolean());
        Assert.NotEqual(default, saved.GetProperty("savedAt").GetDateTimeOffset());

        var again = await Save(_w.Content.Strengths, new { mood = "Hopeful", text = "  Shorter now.  ", action = "", shared = true });
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);

        var reflection = (await Get($"/learning/lessons/{_w.Content.Strengths}/reflection")).GetProperty("reflection");
        Assert.Equal("Hopeful", reflection.GetProperty("mood").GetString());
        Assert.Equal("Shorter now.", reflection.GetProperty("text").GetString());
        Assert.Equal(JsonValueKind.Null, reflection.GetProperty("action").ValueKind);
        Assert.True(reflection.GetProperty("shared").GetBoolean());
        Assert.Single(_w.Query("SELECT Id FROM Reflections"));
        Assert.Equal(["Created", "Updated"], _w.Query("SELECT Action FROM AuditEntries WHERE RecordType = 'Reflection' ORDER BY OccurredAt"));
        var audit = string.Join(" ", _w.Query("SELECT Summary || ' ' || coalesce(BeforeJson, '') || ' ' || coalesce(AfterJson, '') FROM AuditEntries WHERE RecordType = 'Reflection'"));
        Assert.Contains("Shared", audit);
        Assert.DoesNotContain("brother", audit);
        Assert.DoesNotContain("Shorter", audit);
        Assert.DoesNotContain("Hopeful", audit);
    }

    [Fact]
    public async Task A_reflection_needs_a_mood_and_her_words_within_their_limits()
    {
        var empty = await Errors(await Save(_w.Content.Strengths, new { mood = (string?)null, text = "  ", action = (string?)null, shared = false }));
        Assert.Equal("Choose how you’re feeling.", empty.GetProperty("mood").GetString());
        Assert.Equal("Write your reflection.", empty.GetProperty("text").GetString());

        var tooLong = await Errors(await Save(_w.Content.Strengths, new { mood = "Grumpy", text = new string('a', 5001), action = new string('b', 1001), shared = false }));
        Assert.Equal("Choose how you’re feeling.", tooLong.GetProperty("mood").GetString());
        Assert.Equal("Keep your reflection under 5,000 characters.", tooLong.GetProperty("text").GetString());
        Assert.Equal("Keep it under 1,000 characters.", tooLong.GetProperty("action").GetString());

        Assert.Empty(_w.Query("SELECT Id FROM Reflections"));
    }

    [Fact]
    public async Task Locked_draft_and_unfollowed_lessons_consent_other_roles_another_organization_and_Learning_off_are_refused()
    {
        var locked = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_w.Content.Values}/reflection");
        Assert.Equal(HttpStatusCode.Forbidden, locked.StatusCode);
        Assert.Equal("Your Strengths", (await locked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("unlockAfter").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(_w.Content.Values, Valid)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(_w.Content.Circle, Valid)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_w.Content.Voice}/reflection")).StatusCode);

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync($"/learning/lessons/{_w.Content.Strengths}/reflection")).StatusCode);
        foreach (var who in new[] { MentorReviewWork.Daniel, LearningContent.Marisol, LearningContent.Tom })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/learning/lessons/{_w.Content.Strengths}/reflection")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).PutAsJsonAsync($"/learning/lessons/{_w.Content.Strengths}/reflection", Valid)).StatusCode);
        }

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/lessons/{_w.Content.Strengths}/reflection")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).PutAsJsonAsync($"/learning/lessons/{_w.Content.Strengths}/reflection", Valid)).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_w.Content.Strengths}/reflection")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(_w.Content.Strengths, Valid)).StatusCode);
        Assert.Empty(_w.Query("SELECT Id FROM Reflections"));
    }

    private static readonly object Valid = new { mood = "Unsure", text = Words, action = (string?)null, shared = false };

    private Task<HttpResponseMessage> Save(Guid lesson, object body) =>
        _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/lessons/{lesson}/reflection", body);

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    private async Task<JsonElement> Get(string path)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
