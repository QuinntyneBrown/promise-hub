using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-013 guardian enrollment, L2-011 records, L2-026 codes, L2-031 security, L2-007 roles, L2-001 tenant isolation, L2-005 Roster off.
public sealed partial class EnrollmentTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task Staff_open_enrollment_to_get_one_link_and_closing_it_shows_families_the_closed_message()
    {
        var slug = await Open(WinterCamp);

        var page = await _guardian.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}");
        Assert.True(page.GetProperty("open").GetBoolean());
        Assert.Equal("Winter Camp 2026", page.GetProperty("program").GetString());
        Assert.Equal((await Get($"/programs/{WinterCamp}")).GetProperty("enrollmentUrl").GetString(), $"http://localhost:4317/g/enroll/{slug}");

        Assert.Equal(HttpStatusCode.NoContent, (await Staff(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/close", null)).StatusCode);
        var closed = await _guardian.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}");
        Assert.False(closed.GetProperty("open").GetBoolean());
        Assert.Equal("905-555-0100", closed.GetProperty("phone").GetString());
        Assert.Equal(slug, await Open(WinterCamp));
        Assert.Equal(2, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Program' AND Summary LIKE '%enrollment opened%'").Count);
    }

    [Fact]
    public async Task A_code_goes_to_the_contact_the_guardian_typed()
    {
        var slug = await Open(WinterCamp);

        var response = await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "(905) 555-0300" });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Single(Sms.Sent, s => s.To == "905-555-0300" && s.Text.Contains("code is", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_returning_guardian_finds_last_seasons_household_and_children_filled_in()
    {
        var slug = await Open(WinterCamp);

        await Verify(slug, "905-555-0142");
        var draft = await _guardian.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}/draft");

        Assert.True(draft.GetProperty("returning").GetBoolean());
        Assert.Equal("Carmen Rivera", draft.GetProperty("household").GetProperty("guardianName").GetString());
        Assert.Equal("Spanish", draft.GetProperty("household").GetProperty("language").GetString());
        var children = draft.GetProperty("children").EnumerateArray().ToList();
        Assert.Equal(["Mateo", "Sofía"], children.Select(c => c.GetProperty("firstName").GetString()));
        Assert.Equal("2017-03-14", children[0].GetProperty("dateOfBirth").GetString());
        Assert.Equal("Peanuts (anaphylaxis); tree nuts (hives)", children[0].GetProperty("allergies").GetString());
        Assert.Equal("es", draft.GetProperty("language").GetString());
    }

    [Fact]
    public async Task A_new_family_enters_household_child_and_medical_details_and_waits_for_review()
    {
        var slug = await Open(WinterCamp);
        await Verify(slug, "905-555-0300");
        var draft = await _guardian.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}/draft");
        Assert.False(draft.GetProperty("returning").GetBoolean());
        Assert.Equal("905-555-0300", draft.GetProperty("household").GetProperty("mobile").GetString());

        var invalid = await _guardian.PutAsJsonAsync($"/g/enroll/{slug}/draft", new { household = new { guardianName = "", mobile = "", email = "", language = "English" }, children = Array.Empty<object>() });
        var errors = await Errors(invalid);
        Assert.Equal("Enter your full name.", errors.GetProperty("guardianName").GetString());
        Assert.Equal("Add a mobile number or an email.", errors.GetProperty("mobile").GetString());
        Assert.Equal("Add at least one child.", errors.GetProperty("children").GetString());

        Assert.Equal(HttpStatusCode.NoContent, (await SaveNewFamily(slug)).StatusCode);
        var unconsented = await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = false });
        Assert.Equal("Agree to the season consent to submit.", (await Errors(unconsented)).GetProperty("consent").GetString());

        var submitted = await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
        var result = await submitted.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("WaitingReview", result.GetProperty("status").GetString());
        Assert.Single(Query("SELECT Id FROM Households WHERE Name = 'Okafor'"));
        Assert.Equal("Shellfish", Query("SELECT Allergies FROM Children WHERE FirstName = 'Ada'").Single());
        Assert.Equal(1, (await Get($"/programs/{WinterCamp}")).GetProperty("pendingReviews").GetInt32());
        Assert.Empty(Query($"SELECT e.Id FROM Enrollments e WHERE e.ProgramId = '{Upper(WinterCamp)}'"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Enrollment' AND Action = 'Created'"));
        Assert.Equal(HttpStatusCode.Conflict, (await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
    }

    [Fact]
    public async Task A_full_program_waitlists_the_child_with_a_position()
    {
        var created = await Staff(Marisol).PostAsJsonAsync("/programs", new { name = "Chess Club", startsOn = "2027-01-10", endsOn = "2027-04-30", schedule = "Wed, 4–6 pm", capacity = 1, ages = "8–13", enrollmentOpen = false, seasonConsent = true });
        var chess = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        await Staff(Marisol).PostAsJsonAsync($"/programs/{chess}/enrollments", new { childId = Kevin });
        var slug = await Open(chess);
        await Verify(slug, "905-555-0300");
        await SaveNewFamily(slug);

        var result = await (await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("Waitlisted", result.GetProperty("status").GetString());
        Assert.Equal(1, result.GetProperty("position").GetInt32());
    }

    [Fact]
    public async Task Without_a_verified_code_the_draft_and_submit_are_refused_and_three_wrong_codes_lock()
    {
        var slug = await Open(WinterCamp);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _guardian.GetAsync($"/g/enroll/{slug}/draft")).StatusCode);

        await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "905-555-0300" });
        for (var i = 0; i < 3; i++)
        {
            await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact = "905-555-0300", code = "000000" });
        }

        Assert.Equal((HttpStatusCode)423, (await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact = "905-555-0300", code = LastCode() })).StatusCode);
    }

    [Fact]
    public async Task Once_enrollment_closes_a_draft_cannot_be_submitted()
    {
        var slug = await Open(WinterCamp);
        await Verify(slug, "905-555-0300");
        await SaveNewFamily(slug);
        await Staff(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/close", null);

        Assert.Equal(HttpStatusCode.Conflict, (await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
    }

    [Fact]
    public async Task Site_leads_cannot_open_enrollment()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Staff(Jaylen).PostAsync($"/programs/{WinterCamp}/enrollment/open", null)).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_families_and_programs_are_never_reached()
    {
        var slug = await Open(WinterCamp);
        Assert.Equal(HttpStatusCode.NotFound, (await Staff(Grace).PostAsync($"/programs/{WinterCamp}/enrollment/open", null)).StatusCode);

        await Verify(slug, "289-555-0101");
        var draft = await _guardian.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}/draft");

        Assert.False(draft.GetProperty("returning").GetBoolean());
        Assert.Empty(draft.GetProperty("children").EnumerateArray());
    }

    [Fact]
    public async Task With_Roster_off_the_enrollment_link_and_endpoints_answer_404()
    {
        var slug = await Open(WinterCamp);
        await Staff(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.GetAsync($"/g/enroll/{slug}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Staff(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/open", null)).StatusCode);
    }

    private async Task<string> Open(Guid programId)
    {
        var response = await Staff(Marisol).PostAsync($"/programs/{programId}/enrollment/open", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var url = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private async Task Verify(string slug, string contact)
    {
        await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact });
        var verified = await _guardian.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact, code = LastCode() });
        Assert.Equal(HttpStatusCode.NoContent, verified.StatusCode);
    }

    private Task<HttpResponseMessage> SaveNewFamily(string slug) =>
        _guardian.PutAsJsonAsync($"/g/enroll/{slug}/draft", new
        {
            household = new { guardianName = "Ngozi Okafor", mobile = "905-555-0300", email = "ngozi@example.com", language = "English" },
            children = new[] { new { id = (Guid?)null, firstName = "Ada", lastName = "Okafor", dateOfBirth = "2017-05-01", school = "Hess Street School, Grade 4", allergies = "Shellfish", medication = "", enroll = true } },
        });

    private string LastCode() => CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private HttpClient Staff(Guid membership) => _factory.ClientFor(membership);

    private async Task<JsonElement> Get(string path) => await Staff(Marisol).GetFromJsonAsync<JsonElement>(path);

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

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

    public Task InitializeAsync()
    {
        _guardian = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
