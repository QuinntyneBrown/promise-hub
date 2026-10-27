using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-077 criteria 3 to 6, L2-078 criterion 1 (submitting work with a file, its checks, late and closed, reading
// it back; tenancy, roles and Learning off), L2-031.
public sealed class LearningAssignmentSubmitTests : IAsyncLifetime
{
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly byte[] Png = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70];
    private static readonly byte[] Pdf = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 10];
    private const string Reflection = "I stayed after tutoring to stack the chairs so Jaylen could lock up on time. Nobody asked me.";

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task A_reflection_and_photo_are_recorded_as_submitted_stored_privately_audited_and_read_back()
    {
        var assignment = await _c.AssignmentAsync(_c.Knowing);

        var response = await Submit(assignment, Reflection, file: ("stacked-chairs.png", "image/png", Png));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var view = await Get($"/learning/submissions/{id}");
        Assert.Equal(assignment, view.GetProperty("assignmentId").GetGuid());
        Assert.Equal("Serve someone this week", view.GetProperty("assignmentTitle").GetString());
        Assert.Equal(_c.Knowing, view.GetProperty("moduleId").GetGuid());
        Assert.Equal("Submitted", view.GetProperty("status").GetString());
        Assert.False(view.GetProperty("late").GetBoolean());
        Assert.Equal(Reflection, view.GetProperty("text").GetString());
        Assert.Equal(JsonValueKind.Null, view.GetProperty("link").ValueKind);
        var file = view.GetProperty("file");
        Assert.Equal("stacked-chairs.png", file.GetProperty("name").GetString());
        Assert.Equal("Photo", file.GetProperty("kind").GetString());
        Assert.Equal(Png.Length, file.GetProperty("bytes").GetInt64());
        Assert.Equal(25, view.GetProperty("totalPoints").GetInt32());
        var step = Assert.Single(view.GetProperty("history").EnumerateArray());
        Assert.Equal("Submitted", step.GetProperty("kind").GetString());
        Assert.Equal("Nadia Haddad", step.GetProperty("actor").GetString());

        var stored = Assert.Single(_factory.Services.GetRequiredService<FakeFileStore>().Files);
        Assert.StartsWith($"submissions/{DatabaseSeeder.Harbourview}/{id}/", stored.Key);
        Assert.DoesNotContain("stacked-chairs", stored.Key);
        var download = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/submissions/{id}/file");
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal(Png, await download.Content.ReadAsByteArrayAsync());
        Assert.Equal("attachment", download.Content.Headers.ContentDisposition?.DispositionType);
        Assert.Equal("nosniff", download.Headers.GetValues("X-Content-Type-Options").Single());

        var brief = await Get($"/learning/assignments/{assignment}");
        Assert.Equal(id, brief.GetProperty("submission").GetProperty("id").GetGuid());
        Assert.Equal("Submitted", brief.GetProperty("submission").GetProperty("status").GetString());
        var listed = Assert.Single((await Get($"/learning/modules/{_c.Knowing}")).GetProperty("assignments").EnumerateArray());
        Assert.Equal("submitted", listed.GetProperty("status").GetString());
        Assert.Equal(id, listed.GetProperty("submissionId").GetGuid());

        var audit = Query("SELECT Summary FROM AuditEntries WHERE Action = 'Submitted' AND RecordType = 'AssignmentSubmission'");
        Assert.DoesNotContain("stack the chairs", Assert.Single(audit));
    }

    [Fact]
    public async Task The_attestation_some_allowed_work_and_its_limits_are_required()
    {
        var assignment = await _c.AssignmentAsync(_c.Knowing);
        var linkOnly = await _c.AssignmentAsync(_c.Knowing, title: "Share a link", types: ["Link"]);
        var fileOnly = await _c.AssignmentAsync(_c.Knowing, title: "Upload a plan", types: ["File"]);

        var nothing = await Errors(await Submit(assignment, null, attest: false));
        Assert.Equal("Confirm this is your own work.", nothing.GetProperty("attest").GetString());
        Assert.Equal("Write your reflection.", nothing.GetProperty("text").GetString());

        Assert.Equal("Keep your reflection under 5,000 characters.", (await Errors(await Submit(assignment, new string('a', 5001)))).GetProperty("text").GetString());
        Assert.Equal("This assignment doesn’t take a link.", (await Errors(await Submit(assignment, Reflection, link: "https://example.org"))).GetProperty("link").GetString());
        Assert.Equal("Add your link.", (await Errors(await Submit(linkOnly, null))).GetProperty("link").GetString());
        Assert.Equal("Enter a full web address starting with http:// or https://.", (await Errors(await Submit(linkOnly, null, link: "javascript:alert(1)"))).GetProperty("link").GetString());
        Assert.Equal("Add your file.", (await Errors(await Submit(fileOnly, null))).GetProperty("file").GetString());
        Assert.Equal(HttpStatusCode.Created, (await Submit(fileOnly, null, file: ("plan.pdf", "application/pdf", Pdf))).StatusCode);
        Assert.Empty(Query("SELECT Id FROM AssignmentSubmissions WHERE AssignmentId <> '" + fileOnly.ToString().ToUpperInvariant() + "'"));
    }

    [Fact]
    public async Task A_file_must_be_an_allowed_kind_of_up_to_10_MB_whose_name_type_and_first_bytes_agree()
    {
        var assignment = await _c.AssignmentAsync(_c.Knowing);
        const string photo = "Choose a JPG or PNG photo of up to 10 MB.";

        Assert.Equal(photo, (await Errors(await Submit(assignment, Reflection, file: ("plan.pdf", "application/pdf", Pdf)))).GetProperty("file").GetString());
        Assert.Equal(photo, (await Errors(await Submit(assignment, Reflection, file: ("fake.png", "image/png", Pdf)))).GetProperty("file").GetString());
        Assert.Equal(photo, (await Errors(await Submit(assignment, Reflection, file: ("photo.jpg", "image/png", Png)))).GetProperty("file").GetString());
        Assert.Equal(photo, (await Errors(await Submit(assignment, Reflection, file: ("big.jpg", "image/jpeg", [.. Jpeg, .. new byte[10 * 1024 * 1024]])))).GetProperty("file").GetString());
        Assert.Empty(_factory.Services.GetRequiredService<FakeFileStore>().Files);
        Assert.Equal(HttpStatusCode.Created, (await Submit(assignment, Reflection, file: ("photo.JPG", "image/jpeg", Jpeg))).StatusCode);
    }

    [Fact]
    public async Task A_second_submission_answers_submitted_late_work_is_marked_and_a_closed_assignment_refuses()
    {
        var assignment = await _c.AssignmentAsync(_c.Knowing);
        var late = await _c.AssignmentAsync(_c.Knowing, title: "Late allowed", dueDate: "2026-11-01", graceDays: 1, allowLate: true);
        var closed = await _c.AssignmentAsync(_c.Knowing, title: "No late work", dueDate: "2026-11-01", graceDays: 1, allowLate: false);

        Assert.Equal(HttpStatusCode.Created, (await Submit(assignment, Reflection)).StatusCode);
        var again = await Submit(assignment, Reflection);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("submitted", (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());

        var lateId = (await (await Submit(late, Reflection)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        Assert.True((await Get($"/learning/submissions/{lateId}")).GetProperty("late").GetBoolean());

        var refused = await Submit(closed, Reflection);
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
        Assert.Equal("closed", (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Locked_other_roles_Learning_off_and_another_organization_are_refused_and_nothing_is_stored()
    {
        var locked = await _c.AssignmentAsync(_c.Knowing, _c.Strengths, title: "After strengths");
        var assignment = await _c.AssignmentAsync(_c.Knowing);
        var id = (await (await Submit(assignment, Reflection)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        Assert.Equal(HttpStatusCode.Forbidden, (await Submit(locked, Reflection)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Submit(assignment, Reflection, caller: Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/learning/submissions/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/submissions/{Guid.NewGuid()}")).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await Submit(assignment, Reflection, caller: Lucia)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/submissions/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Lucia).GetAsync($"/learning/submissions/{id}/file")).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/submissions/{id}")).StatusCode);
        Assert.Single(Query("SELECT Id FROM AssignmentSubmissions"));
    }

    private Task<HttpResponseMessage> Submit(Guid assignment, string? text, bool attest = true, string? link = null, (string Name, string Type, byte[] Bytes)? file = null, Guid? caller = null)
    {
        var form = new MultipartFormDataContent();
        if (text is not null)
        {
            form.Add(new StringContent(text), "text");
        }
        if (link is not null)
        {
            form.Add(new StringContent(link), "link");
        }
        form.Add(new StringContent(attest ? "true" : "false"), "attest");
        if (file is { } f)
        {
            var content = new ByteArrayContent(f.Bytes);
            content.Headers.ContentType = new MediaTypeHeaderValue(f.Type);
            form.Add(content, "file", f.Name);
        }
        return _factory.ClientFor(caller ?? LearningContent.Nadia).PostAsync($"/learning/assignments/{assignment}/submission", form);
    }

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

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public async Task InitializeAsync() => _c = await new LearningContent(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
