using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Learning;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-078 criteria 1 to 5 (following a submission through In review, Needs revision and Accepted, the mentor's
// feedback and points, revising and resubmitting only when asked). The mentor's review endpoints are prompt 63; until then the review
// is applied through the domain, as those endpoints will.
public sealed class LearningSubmissionStatusTests : IAsyncLifetime
{
    private const string Reflection = "I stayed after tutoring to stack the chairs so Jaylen could lock up on time.";
    private static readonly byte[] Png = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70];
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;
    private Guid _assignment;

    [Fact]
    public async Task In_review_needs_revision_and_accepted_answer_the_status_feedback_points_and_history()
    {
        var id = await SubmitAsync();

        await Review(id, s => s.StartReview("Daniel Osei", _factory.Clock.GetUtcNow().AddHours(12)));
        Assert.Equal("InReview", (await Get($"/learning/submissions/{id}")).GetProperty("status").GetString());
        Assert.Equal("in-review", (await Listed()).GetProperty("status").GetString());

        await Review(id, s => s.RequestRevision("Add a line about one thing you noticed.", "Daniel Osei", _factory.Clock.GetUtcNow().AddHours(13)));
        var revise = await Get($"/learning/submissions/{id}");
        Assert.Equal("NeedsRevision", revise.GetProperty("status").GetString());
        Assert.Equal("Add a line about one thing you noticed.", revise.GetProperty("feedback").GetString());
        Assert.Equal("Daniel Osei", revise.GetProperty("reviewerName").GetString());
        Assert.Equal("NeedsRevision", (await Get($"/learning/assignments/{_assignment}")).GetProperty("submission").GetProperty("status").GetString());
        Assert.Equal("needs-revision", (await Listed()).GetProperty("status").GetString());

        await Review(id, s => s.Accept(25, "This is exactly it.", "Daniel Osei", _factory.Clock.GetUtcNow().AddHours(14)));
        var accepted = await Get($"/learning/submissions/{id}");
        Assert.Equal("Accepted", accepted.GetProperty("status").GetString());
        Assert.Equal(25, accepted.GetProperty("points").GetInt32());
        Assert.Equal(25, accepted.GetProperty("totalPoints").GetInt32());
        Assert.Equal("This is exactly it.", accepted.GetProperty("feedback").GetString());
        Assert.Equal(["Submitted", "ReviewStarted", "RevisionRequested", "Accepted"], accepted.GetProperty("history").EnumerateArray().Select(h => h.GetProperty("kind").GetString()));
        Assert.Equal("Daniel Osei", accepted.GetProperty("history")[3].GetProperty("actor").GetString());
        Assert.Equal("accepted", (await Listed()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_submission_sent_back_is_resubmitted_with_revised_work_and_its_earlier_photo_kept_and_returns_to_submitted()
    {
        var id = await SubmitAsync();
        await Review(id, s => s.RequestRevision("Add a line about one thing you noticed.", "Daniel Osei", _factory.Clock.GetUtcNow().AddHours(1)));
        _factory.Clock.Advance(TimeSpan.FromHours(3));

        var response = await Resubmit(id, Reflection + " I noticed the room is tidy because someone stays behind.");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var view = await Get($"/learning/submissions/{id}");
        Assert.Equal("Submitted", view.GetProperty("status").GetString());
        Assert.Equal(2, view.GetProperty("round").GetInt32());
        Assert.EndsWith("someone stays behind.", view.GetProperty("text").GetString());
        Assert.Equal("stacked-chairs.png", view.GetProperty("file").GetProperty("name").GetString());
        Assert.Equal("Resubmitted", view.GetProperty("history").EnumerateArray().Last().GetProperty("kind").GetString());
        Assert.Single(AuditSummaries("Updated"));
    }

    [Fact]
    public async Task Resubmitting_replaces_or_removes_the_file_and_is_checked_like_a_submit()
    {
        var id = await SubmitAsync();
        await Review(id, s => s.RequestRevision("Try a clearer photo.", "Daniel Osei", _factory.Clock.GetUtcNow().AddHours(1)));
        var store = _factory.Services.GetRequiredService<FakeFileStore>();
        var first = Assert.Single(store.Files).Key;

        Assert.Equal("Confirm this is your own work.", (await Errors(await Resubmit(id, Reflection, attest: false))).GetProperty("attest").GetString());
        Assert.Equal("Choose a JPG or PNG photo of up to 10 MB.", (await Errors(await Resubmit(id, Reflection, file: ("plan.pdf", "application/pdf", "%PDF-1.7"u8.ToArray())))).GetProperty("file").GetString());
        Assert.Equal("Write your reflection.", (await Errors(await Resubmit(id, null, removeFile: true))).GetProperty("text").GetString());

        Assert.Equal(HttpStatusCode.OK, (await Resubmit(id, Reflection, file: ("clearer.jpg", "image/jpeg", Jpeg))).StatusCode);
        Assert.Equal("clearer.jpg", (await Get($"/learning/submissions/{id}")).GetProperty("file").GetProperty("name").GetString());
        Assert.DoesNotContain(first, store.Files.Keys);
        Assert.Single(store.Files);
    }

    [Fact]
    public async Task Only_a_submission_that_needs_revision_can_be_resubmitted_and_only_by_its_owner()
    {
        var id = await SubmitAsync();

        var refused = await Resubmit(id, Reflection);
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
        Assert.Equal("not-revisable", (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        await Review(id, s => s.Accept(20, null, "Daniel Osei", _factory.Clock.GetUtcNow().AddHours(1)));
        Assert.Equal(HttpStatusCode.Conflict, (await Resubmit(id, Reflection)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Resubmit(Guid.NewGuid(), Reflection)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Resubmit(id, Reflection, caller: Lucia)).StatusCode);
        Assert.Equal("Accepted", (await Get($"/learning/submissions/{id}")).GetProperty("status").GetString());
    }

    private async Task<Guid> SubmitAsync()
    {
        var form = new MultipartFormDataContent { { new StringContent(Reflection), "text" }, { new StringContent("true"), "attest" } };
        var photo = new ByteArrayContent(Png);
        photo.Headers.ContentType = new("image/png");
        form.Add(photo, "file", "stacked-chairs.png");
        var response = await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/assignments/{_assignment}/submission", form);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private Task<HttpResponseMessage> Resubmit(Guid id, string? text, bool attest = true, (string Name, string Type, byte[] Bytes)? file = null, bool removeFile = false, Guid? caller = null)
    {
        var form = new MultipartFormDataContent { { new StringContent(attest ? "true" : "false"), "attest" } };
        if (text is not null)
        {
            form.Add(new StringContent(text), "text");
        }
        if (removeFile)
        {
            form.Add(new StringContent("true"), "removeFile");
        }
        if (file is { } f)
        {
            var content = new ByteArrayContent(f.Bytes);
            content.Headers.ContentType = new(f.Type);
            form.Add(content, "file", f.Name);
        }
        return _factory.ClientFor(caller ?? LearningContent.Nadia).PostAsync($"/learning/submissions/{id}/resubmit", form);
    }

    /// <summary>Applies a mentor's review step through the domain, as prompt 63's review endpoints will, with its history step.</summary>
    private async Task Review(Guid id, Func<AssignmentSubmission, SubmissionEvent> step)
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
        var db = scope.ServiceProvider.GetRequiredService<IPromiseHubDb>();
        var submission = await db.AssignmentSubmissions.SingleAsync(s => s.Id == id);
        db.SubmissionEvents.Add(step(submission));
        await db.SaveChangesAsync();
    }

    private async Task<JsonElement> Listed() => Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("assignments").EnumerateArray());

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

    private List<string> AuditSummaries(string action)
    {
        using var connection = new Microsoft.Data.Sqlite.SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = $"SELECT Summary FROM AuditEntries WHERE Action = '{action}' AND RecordType = 'AssignmentSubmission'";
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(reader.GetString(0));
        }
        return rows;
    }

    public async Task InitializeAsync()
    {
        _c = await new LearningContent(_factory).BuildAsync();
        _assignment = await _c.AssignmentAsync(_c.Knowing);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
