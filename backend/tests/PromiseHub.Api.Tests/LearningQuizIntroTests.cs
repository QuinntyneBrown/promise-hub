using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-075 criteria 1, 2 and 8 (a quiz's rules, its lock and the module's quizzes; tenancy, roles and Learning off).
public sealed class LearningQuizIntroTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task A_module_quiz_is_locked_until_every_lesson_of_its_module_is_done_and_is_listed_on_the_module()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);

        var locked = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{quiz}");
        Assert.Equal(HttpStatusCode.Forbidden, locked.StatusCode);
        var body = await locked.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("locked", body.GetProperty("code").GetString());
        Assert.Equal("Your Strengths", body.GetProperty("unlockAfter").GetString());

        var listed = Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("quizzes").EnumerateArray());
        Assert.Equal(quiz, listed.GetProperty("id").GetGuid());
        Assert.Equal("Knowing Yourself quiz", listed.GetProperty("title").GetString());
        Assert.Equal(4, listed.GetProperty("questionCount").GetInt32());
        Assert.Equal("locked", listed.GetProperty("status").GetString());
        Assert.Equal("Your Strengths", listed.GetProperty("unlockAfter").GetString());

        await Complete(_c.Strengths);
        await Complete(_c.Values);
        var open = Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("quizzes").EnumerateArray());
        Assert.Equal("next", open.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, open.GetProperty("bestScore").ValueKind);
    }

    [Fact]
    public async Task The_intro_answers_the_rules_and_her_attempts_and_never_the_correct_answers()
    {
        var quiz = await _c.QuizAsync(_c.Knowing);
        await Complete(_c.Strengths);
        await Complete(_c.Values);

        var intro = await Get($"/learning/quizzes/{quiz}");

        Assert.Equal("Knowing Yourself quiz", intro.GetProperty("title").GetString());
        Assert.Equal(_c.Knowing, intro.GetProperty("moduleId").GetGuid());
        Assert.Equal("Knowing Yourself", intro.GetProperty("moduleTitle").GetString());
        Assert.Equal(4, intro.GetProperty("questionCount").GetInt32());
        Assert.Equal(70, intro.GetProperty("passMark").GetInt32());
        Assert.Equal(2, intro.GetProperty("attemptsAllowed").GetInt32());
        Assert.Equal(0, intro.GetProperty("attemptsUsed").GetInt32());
        Assert.Equal(1, intro.GetProperty("attemptNumber").GetInt32());
        Assert.Equal(JsonValueKind.Null, intro.GetProperty("inProgress").ValueKind);
        Assert.Equal(JsonValueKind.Null, intro.GetProperty("bestScore").ValueKind);
        Assert.True(intro.GetProperty("canStart").GetBoolean());
        Assert.DoesNotContain("Packed the kit bags", intro.GetRawText());
        Assert.DoesNotContain("other people", intro.GetRawText());
    }

    [Fact]
    public async Task A_lesson_quiz_unlocks_when_its_lesson_is_done_and_unlimited_attempts_answer_null()
    {
        var quiz = await _c.QuizAsync(_c.Knowing, _c.Strengths, "Strengths check", attempts: null);

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{quiz}")).StatusCode);
        await Complete(_c.Strengths);

        var intro = await Get($"/learning/quizzes/{quiz}");
        Assert.Equal(JsonValueKind.Null, intro.GetProperty("attemptsAllowed").ValueKind);
        Assert.Equal(_c.Strengths, Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("quizzes").EnumerateArray()).GetProperty("lessonId").GetGuid());
    }

    [Fact]
    public async Task Draft_quizzes_other_roles_Learning_off_and_another_organization_are_refused()
    {
        var draft = await _c.QuizAsync(_c.Knowing, title: "Draft check", publish: false);
        var quiz = await _c.QuizAsync(_c.Knowing);
        await Complete(_c.Strengths);
        await Complete(_c.Values);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{draft}")).StatusCode);
        Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("quizzes").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{Guid.NewGuid()}")).StatusCode);
        Assert.Equal("consent-required", (await (await _factory.ClientFor(Sofia).GetAsync($"/learning/quizzes/{quiz}")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/learning/quizzes/{quiz}")).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/quizzes/{quiz}")).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/quizzes/{quiz}")).StatusCode);
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
