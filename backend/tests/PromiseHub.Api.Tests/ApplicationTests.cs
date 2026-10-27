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
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
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

    [Fact]
    public async Task A_referrer_refers_a_young_person_with_their_guardians_contact_and_is_kept_on_the_request()
    {
        var slug = await Open();
        await Verify(slug, "Rachel.Ellis@bennetto.example.ca");

        Assert.Equal(HttpStatusCode.NoContent, (await SaveReferral(slug)).StatusCode);
        var unagreed = await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = false });
        Assert.Equal("Confirm the family agrees to be contacted.", (await Errors(unagreed)).GetProperty("consent").GetString());

        var result = await (await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("Referrer", result.GetProperty("appliedAs").GetString());
        Assert.False(result.GetProperty("seasonConsent").GetBoolean());
        Assert.Equal("Referrer|Rachel Ellis|Guidance counsellor|Bennetto Elementary|rachel.ellis@bennetto.example.ca|Zoe is curious and kind.|0|Rachel Ellis",
            Query("SELECT r.AppliedAs, r.ReferrerName, r.ReferrerRole, r.ReferrerOrganization, r.ReferrerContact, r.Reason, r.SeasonConsent, r.SubmittedBy FROM EnrollmentRequests r JOIN Children c ON c.Id = r.ChildId WHERE c.FirstName = 'Zoe'").Single());
        Assert.Equal("Tanya Campbell", Query("SELECT g.Name FROM Guardians g JOIN Households h ON h.Id = g.HouseholdId WHERE h.Name = 'Campbell'").Single());
        Assert.Contains("Zoe Campbell referred by Rachel Ellis", Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Enrollment' AND Action = 'Created'").Single());
    }

    [Fact]
    public async Task A_referrers_missing_name_role_reason_and_guardian_are_each_named()
    {
        var slug = await Open();
        await Verify(slug, "rachel.ellis@bennetto.example.ca");

        var errors = await Errors(await SaveReferral(slug, name: "", role: " ", reason: "", guardianName: ""));

        Assert.Equal("Enter your full name.", errors.GetProperty("referrerName").GetString());
        Assert.Equal("Tell us how you know the young person.", errors.GetProperty("referrerRole").GetString());
        Assert.Equal("Tell us why you’re referring them.", errors.GetProperty("reason").GetString());
        Assert.Equal("Enter their parent or guardian’s name.", errors.GetProperty("guardianName").GetString());
    }

    [Fact]
    public async Task Free_text_over_its_limit_is_refused_and_stored_text_stays_plain()
    {
        var slug = await Open();
        await Verify(slug, "rachel.ellis@bennetto.example.ca");

        var errors = await Errors(await SaveReferral(slug, name: new string('a', 101), role: new string('b', 101), organization: new string('c', 121), reason: new string('d', 1001), firstName: new string('e', 101)));

        Assert.Equal("Keep your name under 100 characters.", errors.GetProperty("referrerName").GetString());
        Assert.Equal("Keep your role under 100 characters.", errors.GetProperty("referrerRole").GetString());
        Assert.Equal("Keep the organization under 120 characters.", errors.GetProperty("referrerOrganization").GetString());
        Assert.Equal("Keep it under 1,000 characters.", errors.GetProperty("reason").GetString());
        Assert.Equal("Keep each name under 100 characters.", errors.GetProperty("children[0].name").GetString());

        await SaveReferral(slug, reason: "<script>alert(1)</script>");
        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });
        Assert.Equal("<script>alert(1)</script>", Query("SELECT Reason FROM EnrollmentRequests WHERE AppliedAs = 'Referrer'").Single());
    }

    [Fact]
    public async Task An_application_belongs_to_the_organization_of_the_link_even_when_the_contact_is_another_organizations_family()
    {
        var slug = await Open();
        await Verify(slug, "289-555-0101");
        var draft = await _client.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}/draft");
        Assert.Empty(draft.GetProperty("children").EnumerateArray());
        await SaveYouth(slug);

        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        Assert.Equal(Upper(DatabaseSeeder.Harbourview), Query("SELECT r.OrganizationId FROM EnrollmentRequests r JOIN Children c ON c.Id = r.ChildId WHERE c.FirstName = 'Malik'").Single());
        Assert.Equal(Upper(DatabaseSeeder.Harbourview), Query("SELECT OrganizationId FROM Households WHERE Name = 'Johnson'").Single());
    }

    [Fact]
    public async Task With_Roster_off_every_step_of_an_application_answers_404()
    {
        var slug = await Open();
        await Verify(slug, "905-555-0311");
        await SaveYouth(slug);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "905-555-0311" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/g/enroll/{slug}/draft")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SaveYouth(slug)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
        Assert.Empty(Query("SELECT Id FROM EnrollmentRequests WHERE AppliedAs = 'Youth'"));
    }

    [Fact]
    public async Task A_recorded_application_is_acknowledged_once_to_the_verified_contact_and_a_refused_one_is_not()
    {
        const string ack = "Harbourview Youth Collective received your application for Winter Camp 2026. We’ll be in touch within a few days.";
        var slug = await Open();
        await Verify(slug, "905-555-0311");
        await SaveYouth(slug);

        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = false });
        Assert.DoesNotContain(Sms.Sent, s => s.Text == ack);
        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        Assert.Single(Sms.Sent, s => s.To == "905-555-0311" && s.Text == ack);
    }

    [Fact]
    public async Task A_referrer_is_acknowledged_by_email()
    {
        var slug = await Open();
        await Verify(slug, "rachel.ellis@bennetto.example.ca");
        await SaveReferral(slug);

        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        var email = _factory.Services.GetRequiredService<FakeEmailSender>();
        Assert.Single(email.Bodies, b => b.To == "rachel.ellis@bennetto.example.ca" && b.Body.Contains("received your application for Winter Camp 2026", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_fourth_code_within_15_minutes_is_refused_and_not_sent()
    {
        var slug = await Open();
        for (var i = 0; i < 3; i++)
        {
            Assert.Equal(HttpStatusCode.Accepted, (await _client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "905-555-0311" })).StatusCode);
        }

        var fourth = await _client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "905-555-0311" });

        Assert.Equal((HttpStatusCode)429, fourth.StatusCode);
        Assert.Equal("too-many", (await fourth.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(3, Sms.Sent.Count(s => s.To == "905-555-0311"));
        _factory.Clock.Advance(TimeSpan.FromMinutes(15));
        Assert.Equal(HttpStatusCode.Accepted, (await _client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "905-555-0311" })).StatusCode);
    }

    [Fact]
    public async Task A_second_application_for_the_same_young_person_with_one_open_is_refused_as_a_duplicate()
    {
        var slug = await Open();
        await Verify(slug, "905-555-0311");
        await SaveYouth(slug);
        await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });
        var acknowledged = Sms.Sent.Count;

        await Verify(slug, "rachel.ellis@bennetto.example.ca");
        await _client.PutAsJsonAsync($"/g/enroll/{slug}/draft", new
        {
            applyingAs = "Referrer",
            referrer = new { name = "Rachel Ellis", role = "Guidance counsellor", organization = "" },
            reason = "He asked me to.",
            household = new { guardianName = "Denise Johnson", mobile = "905-555-0310", email = "", language = "English" },
            children = new[] { new { id = (Guid?)null, firstName = " malik ", lastName = "JOHNSON", dateOfBirth = "2012-04-18", school = "", allergies = "", medication = "", enroll = true } },
        });
        var duplicate = await _client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true });

        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        var body = await duplicate.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("duplicate", body.GetProperty("code").GetString());
        Assert.Equal("Malik Johnson", body.GetProperty("name").GetString());
        Assert.Single(Query("SELECT r.Id FROM EnrollmentRequests r JOIN Children c ON c.Id = r.ChildId WHERE lower(c.FirstName) LIKE '%malik%'"));
        Assert.Equal(acknowledged, Sms.Sent.Count);
        Assert.DoesNotContain(_factory.Services.GetRequiredService<FakeEmailSender>().Bodies, b => b.Body.Contains("received your application", StringComparison.Ordinal));
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

    private Task<HttpResponseMessage> SaveReferral(string slug, string name = "Rachel Ellis", string role = "Guidance counsellor", string organization = "Bennetto Elementary",
        string reason = "Zoe is curious and kind.", string guardianName = "Tanya Campbell", string firstName = "Zoe") =>
        _client.PutAsJsonAsync($"/g/enroll/{slug}/draft", new
        {
            applyingAs = "Referrer",
            referrer = new { name, role, organization },
            reason,
            household = new { guardianName, mobile = "905-555-0320", email = "", language = "English" },
            children = new[] { new { id = (Guid?)null, firstName, lastName = "Campbell", dateOfBirth = "2013-01-20", school = "Bennetto Elementary, Grade 8", allergies = "", medication = "", enroll = true } },
        });

    private string LastCode() => CodePattern().Match(Codes().Last()).Value;

    private IEnumerable<string> Codes() =>
        Sms.Sent.Select(s => s.Text).Concat(_factory.Services.GetRequiredService<FakeEmailSender>().Bodies.Select(b => b.Body))
            .Where(t => t.Contains("code is", StringComparison.Ordinal));

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

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
