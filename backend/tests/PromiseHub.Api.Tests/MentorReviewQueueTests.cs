using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-080 criteria 1 and 7, L2-081 criterion 1 (the review queue of a mentor's youth: submissions waiting to
// be graded and quiz results waiting for approval, oldest first; other mentors, organizations, roles and Learning or Mentoring off).
public sealed class MentorReviewQueueTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;

    [Fact]
    public async Task The_queue_lists_the_submissions_and_quiz_results_of_his_youth_that_wait_for_him_oldest_first()
    {
        var submission = await _w.SubmitAsync();
        _factory.Clock.Advance(TimeSpan.FromHours(2));
        var (_, attempt) = await _w.AwaitingQuizAsync();

        var items = (await Get(MentorReviewWork.Daniel, "/mentoring/reviews")).GetProperty("items").EnumerateArray().ToList();

        Assert.Equal([submission, attempt], items.Select(i => i.GetProperty("id").GetGuid()));
        Assert.Equal(["Assignment", "Quiz"], items.Select(i => i.GetProperty("kind").GetString()));
        Assert.All(items, i => Assert.Equal("Nadia Haddad", i.GetProperty("youthName").GetString()));
        Assert.Equal("Serve someone this week", items[0].GetProperty("title").GetString());
        Assert.Equal("Knowing Yourself", items[0].GetProperty("moduleTitle").GetString());
        Assert.False(items[0].GetProperty("late").GetBoolean());
        Assert.Equal(JsonValueKind.Null, items[0].GetProperty("score").ValueKind);
        Assert.Equal("Knowing Yourself quiz", items[1].GetProperty("title").GetString());
        Assert.Equal(75, items[1].GetProperty("score").GetInt32());
        Assert.True(items[0].GetProperty("submittedAt").GetDateTimeOffset() < items[1].GetProperty("submittedAt").GetDateTimeOffset());
    }

    [Fact]
    public async Task Another_mentors_youth_another_organization_and_work_already_graded_never_reach_the_queue()
    {
        await _w.SubmitAsync();
        await _w.AwaitingQuizAsync();
        await _w.TakeAsync(await _w.Content.QuizAsync(_w.Content.Knowing, title: "Scored straight away"));

        Assert.Empty((await Get(MentorReviewWork.Hana, "/mentoring/reviews")).GetProperty("items").EnumerateArray());
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Learning", "Mentoring" } });
        Assert.Empty((await Get(MentorReviewWork.Samuel, "/mentoring/reviews")).GetProperty("items").EnumerateArray());
        Assert.Equal(2, (await Get(MentorReviewWork.Daniel, "/mentoring/reviews")).GetProperty("items").GetArrayLength());

        await _w.AssignAsync(LearningContent.NadiaChild, MentorReviewWork.Hana);
        Assert.Empty((await Get(MentorReviewWork.Daniel, "/mentoring/reviews")).GetProperty("items").EnumerateArray());
        Assert.Equal(2, (await Get(MentorReviewWork.Hana, "/mentoring/reviews")).GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task Other_roles_are_refused_and_with_Learning_or_Mentoring_off_the_queue_is_not_found()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Marisol).GetAsync("/mentoring/reviews")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Nadia).GetAsync("/mentoring/reviews")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(MentorReviewWork.Leo).GetAsync("/mentoring/reviews")).StatusCode);

        await Modules("Roster", "Mentoring");
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync("/mentoring/reviews")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync("/mentoring/dashboard")).StatusCode);
        await Modules("Roster", "Learning");
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync("/mentoring/reviews")).StatusCode);
    }

    private async Task Modules(params string[] on) =>
        Assert.True((await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);

    private async Task<JsonElement> Get(Guid who, string path)
    {
        var response = await _factory.ClientFor(who).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _w = await new MentorReviewWork(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
