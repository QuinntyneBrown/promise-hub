using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-013 criterion 4 review and bulk review, L2-011 records, L2-007 roles, L2-001 tenant isolation, L2-032 audit, L2-005 Roster off.
public sealed partial class EnrollmentReviewTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_queue_lists_children_waiting_review_with_their_family()
    {
        await Enroll("905-555-0300", "Ngozi Okafor", ("Ada", "Okafor", "2017-05-01"));
        await Enroll("905-555-0142", null, null);

        var queue = await Queue("WaitingReview");

        Assert.Equal(["Ada Okafor", "Mateo Rivera", "Sofía Rivera"], queue.Select(r => r.GetProperty("child").GetString()));
        var ada = queue[0];
        Assert.Equal("Ngozi Okafor", ada.GetProperty("guardian").GetString());
        Assert.False(ada.GetProperty("returning").GetBoolean());
        Assert.True(queue[1].GetProperty("returning").GetBoolean());
        Assert.Equal("Peanuts (anaphylaxis); tree nuts (hives); EpiPen 0.3 mg, carried", queue[1].GetProperty("medical").GetString());
    }

    [Fact]
    public async Task Accepting_puts_the_child_on_the_roster_texts_the_guardian_and_is_audited()
    {
        await Enroll("905-555-0300", "Ngozi Okafor", ("Ada", "Okafor", "2017-05-01"));
        var ada = (await Queue("WaitingReview")).Single();

        var accepted = await Review(ada.GetProperty("id").GetGuid(), "Accept", "Welcome! Camp starts at 8 am.");
        await RunJob();

        Assert.Equal(HttpStatusCode.NoContent, accepted.StatusCode);
        var program = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/programs/{WinterCamp}");
        Assert.Equal(1, program.GetProperty("enrolled").GetInt32());
        Assert.Equal(0, program.GetProperty("pendingReviews").GetInt32());
        Assert.Contains(Sms.Sent, s => s.To == "905-555-0300" && s.Text.Contains("Ada is enrolled in Winter Camp 2026. Welcome! Camp starts at 8 am.", StringComparison.Ordinal));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'EnrollmentRequest' AND Summary LIKE '%accepted%'"));
        Assert.Equal(HttpStatusCode.Conflict, (await Review(ada.GetProperty("id").GetGuid(), "Accept", null)).StatusCode);
    }

    [Fact]
    public async Task Waitlisting_gives_the_next_position_and_declining_needs_a_reason()
    {
        await Enroll("905-555-0142", null, null);
        var queue = await Queue("WaitingReview");

        await Review(queue[0].GetProperty("id").GetGuid(), "Waitlist", null);
        var noReason = await Review(queue[1].GetProperty("id").GetGuid(), "Decline", "");
        Assert.Equal("Write a reason the guardian will read.", (await Errors(noReason)).GetProperty("note").GetString());
        await Review(queue[1].GetProperty("id").GetGuid(), "Decline", "Camp is for ages 6 to 12.");
        await RunJob();

        var waitlist = await Queue("Waitlisted");
        Assert.Equal("Mateo Rivera", waitlist.Single().GetProperty("child").GetString());
        Assert.Equal(1, waitlist.Single().GetProperty("position").GetInt32());
        Assert.Empty(await Queue("WaitingReview"));
        Assert.Contains(Sms.Sent, s => s.Text.Contains("Mateo is on the waitlist for Winter Camp 2026, number 1.", StringComparison.Ordinal));
        Assert.Contains(Sms.Sent, s => s.Text.Contains("Sofía wasn’t enrolled in Winter Camp 2026: Camp is for ages 6 to 12.", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Moving_a_waitlisted_child_in_enrolls_them_texts_the_guardian_and_moves_the_others_up()
    {
        await Enroll("905-555-0142", null, null);
        var queue = await Queue("WaitingReview");
        await _factory.ClientFor(Tom).PostAsJsonAsync("/enrollments/review", new { ids = queue.Select(r => r.GetProperty("id").GetGuid()).ToArray(), decision = "Waitlist" });
        var first = (await Queue("Waitlisted")).First(r => r.GetProperty("position").GetInt32() == 1);

        var moved = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/enrollments/{first.GetProperty("id").GetGuid()}/review", new { decision = "Accept", note = "A place opened." });
        await RunJob();

        Assert.Equal(HttpStatusCode.NoContent, moved.StatusCode);
        var left = (await Queue("Waitlisted")).Single();
        Assert.Equal(1, left.GetProperty("position").GetInt32());
        Assert.Equal(1, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/programs/{WinterCamp}")).GetProperty("enrolled").GetInt32());
        Assert.Contains(Sms.Sent, s => s.Text.Contains($"{first.GetProperty("child").GetString()!.Split(' ')[0]} is enrolled in Winter Camp 2026. A place opened.", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Accepting_past_capacity_is_refused_with_the_count()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync($"/programs/{WinterCamp}", new { name = "Winter Camp 2026", startsOn = "2026-12-21", endsOn = "2026-12-23", schedule = "21–23 Dec", capacity = 1, ages = "6–12", enrollmentOpen = true, seasonConsent = true });
        await Enroll("905-555-0142", null, null);
        var queue = await Queue("WaitingReview");
        await Review(queue[0].GetProperty("id").GetGuid(), "Accept", null);

        var full = await Review(queue[1].GetProperty("id").GetGuid(), "Accept", null);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, full.StatusCode);
        Assert.Equal("Winter Camp 2026 is full (1 of 1). Waitlist instead.", (await Errors(full)).GetProperty("decision").GetString());
    }

    [Fact]
    public async Task Bulk_review_accepts_several_in_one_go()
    {
        await Enroll("905-555-0300", "Ngozi Okafor", ("Ada", "Okafor", "2017-05-01"));
        await Enroll("905-555-0142", null, null);
        var ids = (await Queue("WaitingReview")).Select(r => r.GetProperty("id").GetGuid()).ToArray();

        var bulk = await _factory.ClientFor(Tom).PostAsJsonAsync("/enrollments/review", new { ids, decision = "Accept", note = "Welcome!" });

        Assert.Equal(HttpStatusCode.NoContent, bulk.StatusCode);
        Assert.Equal(3, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/programs/{WinterCamp}")).GetProperty("enrolled").GetInt32());
        Assert.Equal(3, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'EnrollmentRequest'").Count);
    }

    [Fact]
    public async Task Site_leads_cannot_review()
    {
        await Enroll("905-555-0300", "Ngozi Okafor", ("Ada", "Okafor", "2017-05-01"));
        var ada = (await Queue("WaitingReview")).Single();

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync($"/programs/{WinterCamp}/enrollments?status=WaitingReview")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/enrollments/{ada.GetProperty("id").GetGuid()}/review", new { decision = "Accept" })).StatusCode);
    }

    [Fact]
    public async Task Another_organization_never_sees_or_reviews_the_requests()
    {
        await Enroll("905-555-0300", "Ngozi Okafor", ("Ada", "Okafor", "2017-05-01"));
        var ada = (await Queue("WaitingReview")).Single();

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/programs/{WinterCamp}/enrollments?status=WaitingReview")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/enrollments/{ada.GetProperty("id").GetGuid()}/review", new { decision = "Accept" })).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_review_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/programs/{WinterCamp}/enrollments?status=WaitingReview")).StatusCode);
    }

    /// <summary>A guardian enrolls through the link: a new family with one child, or a returning family's children as filled in.</summary>
    private async Task Enroll(string contact, string? guardianName, (string First, string Last, string Dob)? child)
    {
        var open = await _factory.ClientFor(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/open", null);
        var url = (await open.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        var slug = url[(url.LastIndexOf('/') + 1)..];
        var guardian = _factory.CreateClient();
        await guardian.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact });
        var code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        await guardian.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact, code });
        if (child is { } c)
        {
            await guardian.PutAsJsonAsync($"/g/enroll/{slug}/draft", new
            {
                household = new { guardianName, mobile = contact, email = "", language = "English" },
                children = new[] { new { id = (Guid?)null, firstName = c.First, lastName = c.Last, dateOfBirth = c.Dob, school = "", allergies = "", medication = "", enroll = true } },
            });
        }
        else
        {
            var draft = await guardian.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}/draft");
            await guardian.PutAsJsonAsync($"/g/enroll/{slug}/draft", new { household = draft.GetProperty("household"), children = draft.GetProperty("children") });
        }
        var submitted = await guardian.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });
        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
    }

    private async Task<List<JsonElement>> Queue(string status) =>
        [.. (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/programs/{WinterCamp}/enrollments?status={status}")).GetProperty("requests").EnumerateArray()];

    private Task<HttpResponseMessage> Review(Guid id, string decision, string? note) =>
        _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{id}/review", new { decision, note });

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
