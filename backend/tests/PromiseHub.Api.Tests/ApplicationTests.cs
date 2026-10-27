using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-071 applying or referring a young person through the enrollment link; L2-013 enrollment, L2-026 codes, L2-031 security,
// L2-001 tenant isolation, L2-005 Roster off.
public sealed partial class ApplicationTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _client = null!;

    [Fact]
    public async Task A_young_person_applies_for_himself_with_his_guardians_contact_and_waits_for_review_without_season_consent()
    {
        var slug = await Open();
        await Verify(slug, "905-555-0311");

        Assert.Equal(HttpStatusCode.NoContent, (await SaveYouth(slug)).StatusCode);
        var unagreed = await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = false });
        Assert.Equal("Agree to the privacy notice to submit.", (await Errors(unagreed)).GetProperty("consent").GetString());

        var submitted = await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
        var result = await submitted.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("WaitingReview", result.GetProperty("status").GetString());
        Assert.Equal("Youth", result.GetProperty("appliedAs").GetString());
        Assert.False(result.GetProperty("seasonConsent").GetBoolean());
        Assert.Equal("Denise Johnson|905-555-0310", Query("SELECT g.Name, g.Mobile FROM Guardians g JOIN Households h ON h.Id = g.HouseholdId WHERE h.Name = 'Johnson'").Single());
        Assert.Equal("Youth|I want to learn to code and help with the younger kids.|0|Malik Johnson",
            Query("SELECT r.AppliedAs, r.Reason, r.SeasonConsent, r.SubmittedBy FROM EnrollmentRequests r JOIN Children c ON c.Id = r.ChildId WHERE c.FirstName = 'Malik'").Single());
        Assert.Contains("Malik Johnson applying for themselves", Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Enrollment' AND Action = 'Created'").Single());
        Assert.Empty(Query("SELECT Id FROM Memberships WHERE Email LIKE '%johnson%'"));
    }

    [Fact]
    public async Task A_young_person_aged_18_gives_the_season_consent_themselves()
    {
        var slug = await Open();
        await Verify(slug, "905-555-0312");
        await SaveYouth(slug, firstName: "Tobi", dateOfBirth: "2008-03-01");

        var unagreed = await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = false });
        Assert.Equal("Agree to the season consent to submit.", (await Errors(unagreed)).GetProperty("consent").GetString());
        var result = await (await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(result.GetProperty("seasonConsent").GetBoolean());
    }

    [Theory]
    [InlineData("2016-02-10")]
    [InlineData("2007-06-01")]
    public async Task A_young_person_outside_12_to_18_is_asked_to_have_a_guardian_apply(string dateOfBirth)
    {
        var slug = await Open();
        await Verify(slug, "905-555-0311");

        var errors = await Errors(await SaveYouth(slug, dateOfBirth: dateOfBirth));

        Assert.Equal("Young people aged 12 to 18 can apply for themselves. Ask a parent or guardian to apply for you.", errors.GetProperty("children[0].dateOfBirth").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
    }

    [Fact]
    public async Task A_young_persons_missing_name_reason_and_guardian_are_each_named()
    {
        var slug = await Open();
        await Verify(slug, "905-555-0311");

        var errors = await Errors(await SaveYouth(slug, firstName: "", reason: "", guardianName: "", guardianMobile: ""));

        Assert.Equal("Enter the young person’s first and last name.", errors.GetProperty("children[0].name").GetString());
        Assert.Equal("Tell us why you’re interested.", errors.GetProperty("reason").GetString());
        Assert.Equal("Enter your parent or guardian’s name.", errors.GetProperty("guardianName").GetString());
        Assert.Equal("Add a mobile number or an email.", errors.GetProperty("mobile").GetString());
    }

    [Fact]
    public async Task A_young_person_whose_phone_matches_a_family_gets_a_new_household_never_that_family()
    {
        var slug = await Open();
        await Verify(slug, "905-555-0142");
        await SaveYouth(slug);
        const string rivera = "SELECT c.Id FROM Children c JOIN Households h ON h.Id = c.HouseholdId WHERE h.Name = 'Rivera'";
        var before = Query(rivera).Count;

        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        Assert.Equal("Johnson", Query("SELECT h.Name FROM Children c JOIN Households h ON h.Id = c.HouseholdId WHERE c.FirstName = 'Malik'").Single());
        Assert.Equal(before, Query(rivera).Count);
    }

    private async Task<string> Open()
    {
        var response = await _factory.ClientFor(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/open", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var url = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private async Task Verify(string slug, string contact)
    {
        await _client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact });
        var verified = await _client.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact, code = LastCode() });
        Assert.Equal(HttpStatusCode.NoContent, verified.StatusCode);
    }

    private Task<HttpResponseMessage> SaveYouth(string slug, string firstName = "Malik", string dateOfBirth = "2012-04-18",
        string reason = "I want to learn to code and help with the younger kids.", string guardianName = "Denise Johnson", string guardianMobile = "905-555-0310") =>
        _client.PutAsJsonAsync($"/g/enroll/{slug}/draft", new
        {
            applyingAs = "Youth",
            reason,
            household = new { guardianName, mobile = guardianMobile, email = "", language = "English" },
            children = new[] { new { id = (Guid?)null, firstName, lastName = "Johnson", dateOfBirth, school = "Sir John A. Macdonald, Grade 9", allergies = "", medication = "", enroll = true } },
        });

    private string LastCode() => CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

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
        _client = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
