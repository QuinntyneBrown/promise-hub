using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-072 reviewing and placing applicants; L2-013 review decisions, L2-007 roles, L2-001 tenant isolation, L2-032 audit,
// L2-005 Roster off.
public sealed partial class ApplicationReviewTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_pipeline_lists_every_waiting_application_newest_first_with_who_applied_and_the_counts()
    {
        await ApplyAsYouth("905-555-0311");
        await Refer("rachel.ellis@bennetto.example.ca");

        var list = await List("WaitingReview");

        var rows = list.GetProperty("applications").EnumerateArray().ToList();
        Assert.Equal(["Zoe Campbell", "Malik Johnson"], rows.Select(r => r.GetProperty("child").GetString()));
        var zoe = rows[0];
        Assert.Equal("Referrer", zoe.GetProperty("appliedAs").GetString());
        Assert.Equal("Rachel Ellis", zoe.GetProperty("appliedBy").GetString());
        Assert.Equal("Guidance counsellor", zoe.GetProperty("referrerRole").GetString());
        Assert.Equal("Winter Camp 2026", zoe.GetProperty("program").GetString());
        Assert.False(zoe.GetProperty("seasonConsent").GetBoolean());
        Assert.Equal("Youth", rows[1].GetProperty("appliedAs").GetString());
        Assert.Equal(13, zoe.GetProperty("age").GetInt32());
        var counts = list.GetProperty("counts");
        Assert.Equal(2, counts.GetProperty("waitingReview").GetInt32());
        Assert.Equal(0, counts.GetProperty("accepted").GetInt32());
    }

    [Fact]
    public async Task The_status_filter_answers_waitlisted_and_decided_applications_with_who_decided()
    {
        await ApplyAsYouth("905-555-0311");
        await Refer("rachel.ellis@bennetto.example.ca");
        var waiting = (await List("WaitingReview")).GetProperty("applications").EnumerateArray().ToList();
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{Id(waiting[0])}/review", new { decision = "Decline", note = "Camp is full this year." });
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{Id(waiting[1])}/review", new { decision = "Waitlist" });

        var declined = (await List("Declined")).GetProperty("applications").EnumerateArray().Single();
        var waitlisted = (await List("Waitlisted")).GetProperty("applications").EnumerateArray().Single();

        Assert.Equal("Zoe Campbell", declined.GetProperty("child").GetString());
        Assert.Equal("Tom Nguyen", declined.GetProperty("reviewedBy").GetString());
        Assert.Equal("Camp is full this year.", declined.GetProperty("note").GetString());
        Assert.Equal(1, waitlisted.GetProperty("position").GetInt32());
        Assert.Empty((await List("WaitingReview")).GetProperty("applications").EnumerateArray());
        Assert.Equal(1, (await List("Accepted")).GetProperty("counts").GetProperty("declined").GetInt32());
    }

    [Fact]
    public async Task Only_admins_and_program_directors_open_the_pipeline()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Marisol).GetAsync("/applications")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/applications")).StatusCode);
    }

    [Fact]
    public async Task Another_organization_never_sees_the_applications()
    {
        await Refer("rachel.ellis@bennetto.example.ca");

        var list = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/applications");

        Assert.Empty(list.GetProperty("applications").EnumerateArray());
        Assert.Equal(0, list.GetProperty("counts").GetProperty("waitingReview").GetInt32());
    }

    [Fact]
    public async Task With_Roster_off_the_pipeline_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/applications")).StatusCode);
    }

    private async Task<JsonElement> List(string status) =>
        await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications?status={status}");

    private static Guid Id(JsonElement row) => row.GetProperty("id").GetGuid();

    private async Task<string> Open()
    {
        var response = await _factory.ClientFor(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/open", null);
        var url = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        return url[(url.LastIndexOf('/') + 1)..];
    }

    /// <summary>Malik Johnson, 14, applies for himself; his mother Denise is the household.</summary>
    private Task ApplyAsYouth(string contact) => Submit(contact, new
    {
        applyingAs = "Youth",
        reason = "I want to learn to code and help with the younger kids.",
        household = new { guardianName = "Denise Johnson", mobile = "905-555-0310", email = "", language = "English" },
        children = new[] { new { id = (Guid?)null, firstName = "Malik", lastName = "Johnson", dateOfBirth = "2012-04-18", school = "", allergies = "", medication = "", enroll = true } },
    });

    /// <summary>Rachel Ellis refers Zoe Campbell, 13; Tanya Campbell is the household.</summary>
    private Task Refer(string contact) => Submit(contact, new
    {
        applyingAs = "Referrer",
        referrer = new { name = "Rachel Ellis", role = "Guidance counsellor", organization = "Bennetto Elementary" },
        reason = "Zoe is curious and kind.",
        household = new { guardianName = "Tanya Campbell", mobile = "905-555-0320", email = "", language = "English" },
        children = new[] { new { id = (Guid?)null, firstName = "Zoe", lastName = "Campbell", dateOfBirth = "2013-01-20", school = "", allergies = "", medication = "", enroll = true } },
    });

    private async Task Submit(string contact, object draft)
    {
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var slug = await Open();
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact });
        await client.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact, code = LastCode() });
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/g/enroll/{slug}/draft", draft)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
    }

    private string LastCode() => CodePattern().Match(Sms.Sent.Select(s => s.Text).Concat(_factory.Services.GetRequiredService<FakeEmailSender>().Bodies.Select(b => b.Body))
        .Last(t => t.Contains("code is", StringComparison.Ordinal))).Value;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

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
