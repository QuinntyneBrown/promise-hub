using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-055 guardian consent with a typed signature, L2-058 criteria 3 to 6 the consent on the child record, L2-026 links and codes,
// L2-027 language, L2-032 audit, L2-001 tenant isolation, L2-005 Roster off, L2-007 roles.
public sealed partial class GuardianConsentTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid SofiaYouth = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Nadia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private const string Wording = "I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, and to staff contacting them about their program.";

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task Staff_see_that_Sofia_needs_consent_and_children_who_do_not_need_it()
    {
        var sofia = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/children/{Sofia}/consent");
        var nadia = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{Nadia}/consent");
        var mateo = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{Mateo}/consent");

        Assert.True(sofia.GetProperty("required").GetBoolean());
        Assert.Equal(18, sofia.GetProperty("consentAge").GetInt32());
        Assert.Equal("Needed", sofia.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, sofia.GetProperty("linkSentAt").ValueKind);
        Assert.False(nadia.GetProperty("required").GetBoolean());
        Assert.False(mateo.GetProperty("required").GetBoolean());
    }

    [Fact]
    public async Task An_admin_texts_a_consent_link_in_the_households_language_to_the_guardian_who_may_sign()
    {
        var sent = await _factory.ClientFor(Tom).PostAsync($"/children/{Sofia}/consent-request", null);

        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        Assert.Equal("•••-•••-0142", Assert.Single((await sent.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("sentTo").EnumerateArray()).GetString());
        var text = Assert.Single(Sms.Sent, s => s.Text.Contains("/g/consent/", StringComparison.Ordinal));
        Assert.Equal("905-555-0142", text.To);
        Assert.Contains("Sofía", text.Text, StringComparison.Ordinal);
        Assert.Contains("consentimiento", text.Text, StringComparison.Ordinal);
        Assert.DoesNotContain(Sms.Sent, s => s.To == "905-555-0199");
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianConsent' AND Action = 'Sent'"));
        var status = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{Sofia}/consent");
        Assert.NotEqual(JsonValueKind.Null, status.GetProperty("linkSentAt").ValueKind);
    }

    [Fact]
    public async Task Only_admins_and_program_directors_send_links_and_participants_read_nothing()
    {
        Assert.Equal(HttpStatusCode.Accepted, (await _factory.ClientFor(Marisol).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(SofiaYouth).GetAsync($"/children/{Sofia}/consent")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(SofiaYouth).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_child_is_not_found_and_nothing_is_sent_or_audited()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/children/{Sofia}/consent")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);

        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains("/g/consent/", StringComparison.Ordinal));
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianConsent'"));
    }

    [Fact]
    public async Task A_child_who_does_not_need_consent_gets_no_link()
    {
        Assert.Equal(HttpStatusCode.Conflict, (await _factory.ClientFor(Tom).PostAsync($"/children/{Nadia}/consent-request", null)).StatusCode);
    }

    [Fact]
    public async Task A_consent_link_on_a_new_device_asks_for_a_code_and_a_verified_device_reads_the_consent_in_Spanish()
    {
        var token = await SendLink();

        var unverified = await _guardian.GetAsync($"/g/consent/{token}");
        Assert.Equal(HttpStatusCode.Unauthorized, unverified.StatusCode);
        Assert.Equal("es", (await unverified.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("language").GetString());

        await Verify(token);
        var page = await _guardian.GetFromJsonAsync<JsonElement>($"/g/consent/{token}");

        Assert.Equal("es", page.GetProperty("language").GetString());
        Assert.Equal("Harbourview Youth Collective", page.GetProperty("organization").GetString());
        Assert.Equal("Carmen", page.GetProperty("guardianName").GetString());
        Assert.Equal("Sofía Rivera", page.GetProperty("child").GetProperty("name").GetString());
        Assert.Equal(12, page.GetProperty("child").GetProperty("age").GetInt32());
        Assert.Equal(Wording, page.GetProperty("wording").GetString());
        Assert.Equal("Needed", page.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Signing_records_the_guardian_relationship_time_device_language_wording_and_a_reference()
    {
        var token = await SendLink();
        await Verify(token);
        _guardian.DefaultRequestHeaders.UserAgent.ParseAdd("CarmenPhone/1.0");

        var signed = await Sign(token, "  carmen   rivera ");

        Assert.Equal(HttpStatusCode.NoContent, signed.StatusCode);
        var row = Assert.Single(Query("SELECT SignedBy, Relationship, Language, Device, WordingHash, Reference, Wording FROM GuardianConsents")).Split('|');
        Assert.Equal("Carmen Rivera", row[0]);
        Assert.Equal("Parent", row[1]);
        Assert.Equal("Spanish", row[2]);
        Assert.Contains("CarmenPhone/1.0", row[3], StringComparison.Ordinal);
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Wording))), row[4]);
        Assert.Matches("^GC-[A-Z0-9]{6}$", row[5]);
        Assert.Equal(Wording, row[6]);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianConsent' AND Action = 'Signed'"));
        Assert.Contains(Email.Sent, e => e.To == "carmen.rivera@example.com");
        var page = await _guardian.GetFromJsonAsync<JsonElement>($"/g/consent/{token}");
        Assert.Equal("Given", page.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", page.GetProperty("signedBy").GetString());
        Assert.Equal("Parent", page.GetProperty("relationship").GetString());
        Assert.Equal(row[5], page.GetProperty("reference").GetString());
        var staff = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{Sofia}/consent");
        Assert.Equal("Given", staff.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", staff.GetProperty("signedBy").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await Sign(token, "Carmen Rivera")).StatusCode);
    }

    [Fact]
    public async Task A_missing_relationship_an_unticked_box_no_name_or_a_name_that_may_not_sign_is_refused()
    {
        var token = await SendLink();
        await Verify(token);

        var noRelationship = await _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name = "Carmen Rivera", relationship = "", agree = true });
        var unticked = await _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name = "Carmen Rivera", relationship = "Parent", agree = false });
        var noName = await _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name = " ", relationship = "Parent", agree = true });
        var luis = await Sign(token, "Luis Rivera");

        Assert.Equal("Choose how you’re related to Sofía.", (await Errors(noRelationship)).GetProperty("relationship").GetString());
        Assert.Equal("Tick the box to give consent.", (await Errors(unticked)).GetProperty("agree").GetString());
        Assert.Equal("Type your full name to sign.", (await Errors(noName)).GetProperty("name").GetString());
        Assert.Equal("That name doesn’t match a guardian of Sofía.", (await Errors(luis)).GetProperty("name").GetString());
        Assert.Empty(Query("SELECT Id FROM GuardianConsents"));
    }

    [Fact]
    public async Task A_link_older_than_30_days_or_replaced_by_a_newer_one_has_expired()
    {
        var first = await SendLink();
        await Verify(first);
        _factory.Clock.Advance(TimeSpan.FromMinutes(11));
        var second = await SendLink();

        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync($"/g/consent/{first}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _guardian.GetAsync($"/g/consent/{second}")).StatusCode);

        _factory.Clock.Advance(TimeSpan.FromDays(31));
        var expired = await _guardian.GetAsync($"/g/consent/{second}");
        Assert.Equal(HttpStatusCode.Gone, expired.StatusCode);
        Assert.Equal("905-555-0100", (await expired.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("phone").GetString());
        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync("/g/consent/not-a-real-token")).StatusCode);
    }

    [Fact]
    public async Task A_consent_link_opens_no_family_page()
    {
        var token = await SendLink();
        await Verify(token);

        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync($"/g/home/{token}")).StatusCode);
        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync($"/g/slips/{token}")).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_the_consent_endpoints_answer_404()
    {
        var token = await SendLink();
        await Verify(token);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.GetAsync($"/g/consent/{token}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Sign(token, "Carmen Rivera")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/children/{Sofia}/consent")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);
    }

    /// <summary>Tom sends Sofía's consent link; returns the token from the text Carmen receives.</summary>
    private async Task<string> SendLink()
    {
        var before = Sms.Sent.Count;
        Assert.Equal(HttpStatusCode.Accepted, (await _factory.ClientFor(Tom).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);
        return LinkPattern().Match(Sms.Sent.Skip(before).Last(s => s.Text.Contains("/g/consent/", StringComparison.Ordinal)).Text).Groups["token"].Value;
    }

    private async Task Verify(string token)
    {
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code })).StatusCode);
    }

    private Task<HttpResponseMessage> Sign(string token, string name) =>
        _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name, relationship = "Parent", agree = true });

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"/g/consent/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex LinkPattern();

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
