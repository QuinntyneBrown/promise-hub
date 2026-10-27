using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-080 criteria 2 to 7 (opening a submission starts the review, the file, draft, approve and revise grades
// checked against the rubric, not reviewable once graded, scope, roles, tenancy and modules), L2-083 criteria 1 to 3 (stale saves),
// L2-032 (every grade audited).
public sealed class MentorGradeTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _w = null!;
    private Guid _id;

    [Fact]
    public async Task Opening_a_submission_answers_the_work_rubric_and_history_and_the_first_open_starts_the_review()
    {
        var view = await Review();

        Assert.Equal("Nadia Haddad", view.GetProperty("youthName").GetString());
        Assert.Equal("Serve someone this week", view.GetProperty("assignmentTitle").GetString());
        Assert.Equal("Knowing Yourself", view.GetProperty("moduleTitle").GetString());
        Assert.StartsWith("Choose one person to serve", view.GetProperty("brief").GetString());
        Assert.Equal(MentorReviewWork.Reflection, view.GetProperty("text").GetString());
        Assert.Equal("stacked-chairs.png", view.GetProperty("file").GetProperty("name").GetString());
        Assert.Equal("InReview", view.GetProperty("status").GetString());
        Assert.Equal(1, view.GetProperty("round").GetInt32());
        Assert.False(view.GetProperty("late").GetBoolean());
        var rubric = view.GetProperty("rubric").EnumerateArray().ToList();
        Assert.Equal([10, 10, 5], rubric.Select(r => r.GetProperty("points").GetInt32()));
        Assert.Equal("Chose someone and served without being asked", rubric[0].GetProperty("description").GetString());
        Assert.All(rubric, r => Assert.Equal(JsonValueKind.Null, r.GetProperty("score").ValueKind));
        Assert.Equal(25, view.GetProperty("totalPoints").GetInt32());
        Assert.Equal(["Submitted", "ReviewStarted"], view.GetProperty("history").EnumerateArray().Select(h => h.GetProperty("kind").GetString()));
        Assert.Equal("Daniel Osei", view.GetProperty("history")[1].GetProperty("actor").GetString());
        Assert.Equal("InReview", (await Youth($"/learning/submissions/{_id}")).GetProperty("status").GetString());

        var again = await Review();
        Assert.Equal(view.GetProperty("version").GetInt32(), again.GetProperty("version").GetInt32());
        Assert.Equal(2, again.GetProperty("history").GetArrayLength());
        Assert.Single(_w.Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'AssignmentSubmission' AND Action = 'Updated'"));
    }

    [Fact]
    public async Task The_mentor_downloads_the_file_as_an_attachment()
    {
        var response = await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/submissions/{_id}/file");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/png", response.Content.Headers.ContentType!.MediaType);
        Assert.Equal("stacked-chairs.png", response.Content.Headers.ContentDisposition!.FileName!.Trim('"'));
        Assert.Equal(MentorReviewWork.Png, await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task A_draft_keeps_the_scores_and_comment_without_changing_anything_the_youth_sees()
    {
        var view = await Review();

        var saved = await Grade("draft", [10, 8, null], "Strong start.", view);

        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var again = await Review();
        Assert.Equal("InReview", again.GetProperty("status").GetString());
        Assert.Equal([10, 8], again.GetProperty("rubric").EnumerateArray().Where(r => r.GetProperty("score").ValueKind != JsonValueKind.Null).Select(r => r.GetProperty("score").GetInt32()));
        Assert.Equal("Strong start.", again.GetProperty("comment").GetString());
        Assert.True(again.GetProperty("version").GetInt32() > view.GetProperty("version").GetInt32());
        var youth = await Youth($"/learning/submissions/{_id}");
        Assert.Equal("InReview", youth.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, youth.GetProperty("feedback").ValueKind);
        Assert.Equal(JsonValueKind.Null, youth.GetProperty("points").ValueKind);
    }

    [Fact]
    public async Task Approving_needs_every_criterion_scored_within_its_points_and_accepts_it_with_the_total_notified_and_audited()
    {
        var view = await Review();

        var errors = await Errors(await Grade("approve", [12, 10, null], "", view));
        Assert.Equal("Give 0 to 10 points.", errors.GetProperty("scores.0").GetString());
        Assert.Equal("Score this criterion before you approve.", errors.GetProperty("scores.2").GetString());
        Assert.Equal("InReview", (await Review()).GetProperty("status").GetString());

        var approved = await Grade("approve", [10, 10, 5], "This is exactly it, Nadia.", view);

        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);
        var body = await approved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Accepted", body.GetProperty("status").GetString());
        Assert.Equal(25, body.GetProperty("points").GetInt32());
        var youth = await Youth($"/learning/submissions/{_id}");
        Assert.Equal("Accepted", youth.GetProperty("status").GetString());
        Assert.Equal(25, youth.GetProperty("points").GetInt32());
        Assert.Equal("This is exactly it, Nadia.", youth.GetProperty("feedback").GetString());
        Assert.Equal("Daniel Osei", youth.GetProperty("reviewerName").GetString());
        Assert.Equal("Accepted", youth.GetProperty("history").EnumerateArray().Last().GetProperty("kind").GetString());
        Assert.Single(_w.Query($"SELECT Text FROM Notifications WHERE upper(MembershipId) = upper('{LearningContent.Nadia}') AND Text LIKE '%approved%'"));
        Assert.Contains(_w.Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'AssignmentSubmission' AND Action = 'Updated'"), s => s.Contains("approved") && s.Contains("25 of 25"));
        Assert.Empty((await Mentor("/mentoring/reviews")).GetProperty("items").EnumerateArray());

        var again = await Grade("revise", [10, 10, 5], "One more line.", await Review());
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("not-reviewable", (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Requesting_a_revision_needs_a_note_and_sends_it_back_so_she_can_resubmit()
    {
        var view = await Review();

        Assert.Equal("Write what they should change.", (await Errors(await Grade("revise", [null, null, null], " ", view))).GetProperty("comment").GetString());

        var sent = await Grade("revise", [8, 10, 2], "Add a line about one thing you noticed.", view);

        Assert.Equal(HttpStatusCode.OK, sent.StatusCode);
        var youth = await Youth($"/learning/submissions/{_id}");
        Assert.Equal("NeedsRevision", youth.GetProperty("status").GetString());
        Assert.Equal("Add a line about one thing you noticed.", youth.GetProperty("feedback").GetString());
        Assert.Equal(JsonValueKind.Null, youth.GetProperty("points").ValueKind);
        Assert.Single(_w.Query($"SELECT Text FROM Notifications WHERE upper(MembershipId) = upper('{LearningContent.Nadia}') AND Text LIKE '%revision%'"));
        Assert.Empty((await Mentor("/mentoring/reviews")).GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task A_grade_against_an_older_version_is_refused_and_nothing_changes()
    {
        var view = await Review();
        await _w.AssignAsync(LearningContent.NadiaChild, MentorReviewWork.Hana);
        var hana = await (await _factory.ClientFor(MentorReviewWork.Hana).GetAsync($"/mentoring/submissions/{_id}")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.OK, (await Grade("draft", [10, null, null], "Hana's draft.", hana, MentorReviewWork.Hana)).StatusCode);
        await _w.AssignAsync(LearningContent.NadiaChild, MentorReviewWork.Daniel);

        var stale = await Grade("approve", [10, 10, 5], "Lovely.", view);

        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Equal("stale", (await stale.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        var latest = await Review();
        Assert.Equal("InReview", latest.GetProperty("status").GetString());
        Assert.Equal("Hana's draft.", latest.GetProperty("comment").GetString());
        Assert.Equal(HttpStatusCode.OK, (await Grade("approve", [10, 10, 5], "Lovely.", latest)).StatusCode);
    }

    [Fact]
    public async Task Another_mentors_youth_another_organization_other_roles_and_Learning_off_are_refused()
    {
        var view = await Review();
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Hana).GetAsync($"/mentoring/submissions/{_id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Hana).GetAsync($"/mentoring/submissions/{_id}/file")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Grade("approve", [10, 10, 5], "", view, MentorReviewWork.Hana)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/submissions/{Guid.NewGuid()}")).StatusCode);
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Learning", "Mentoring" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Samuel).GetAsync($"/mentoring/submissions/{_id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Grade("approve", [10, 10, 5], "", view, MentorReviewWork.Samuel)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(LearningContent.Marisol).GetAsync($"/mentoring/submissions/{_id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Grade("approve", [10, 10, 5], "", view, LearningContent.Nadia)).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Mentoring" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync($"/mentoring/submissions/{_id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Grade("approve", [10, 10, 5], "", view)).StatusCode);
        Assert.Equal("InReview", _w.Query($"SELECT Status FROM AssignmentSubmissions WHERE upper(Id) = upper('{_id}')").Single());
    }

    private Task<HttpResponseMessage> Grade(string decision, int?[] scores, string comment, JsonElement view, Guid? who = null)
    {
        var criteria = view.GetProperty("rubric").EnumerateArray().Select(r => r.GetProperty("id").GetGuid()).ToList();
        var list = scores.Select((p, i) => new { criterionId = criteria[i], points = p }).Where(s => s.points is not null).ToArray();
        return _factory.ClientFor(who ?? MentorReviewWork.Daniel).PostAsJsonAsync($"/mentoring/submissions/{_id}/grade",
            new { decision, scores = list, comment, version = view.GetProperty("version").GetInt32() });
    }

    private Task<JsonElement> Review() => Mentor($"/mentoring/submissions/{_id}");

    private async Task<JsonElement> Mentor(string path)
    {
        var response = await _factory.ClientFor(MentorReviewWork.Daniel).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<JsonElement> Youth(string path)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    public async Task InitializeAsync()
    {
        _w = await new MentorReviewWork(_factory).BuildAsync();
        _id = await _w.SubmitAsync();
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
