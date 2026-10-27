using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-056 consent gating for youth under the consent age, L2-057 criteria 1 and 4 safeguards on the server, L2-005 Learning off,
// L2-007 roles, L2-032 audit.
public sealed partial class YouthConsentGateTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly string[] WithLearning = [.. Suite, "Learning"];

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task Sofia_under_18_without_consent_is_refused_her_lessons_while_Nadia_at_18_is_not()
    {
        var sofia = await Lessons(Sofia);
        var nadia = await Lessons(Nadia);

        Assert.Equal(HttpStatusCode.Forbidden, sofia.StatusCode);
        var gate = await sofia.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("consent-required", gate.GetProperty("code").GetString());
        Assert.Equal(18, gate.GetProperty("consentAge").GetInt32());
        Assert.Equal(HttpStatusCode.OK, nadia.StatusCode);
        Assert.Empty((await nadia.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lessons").EnumerateArray());
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Sofia).GetAsync("/learning/me")).StatusCode);
    }

    [Fact]
    public async Task Sofia_asks_her_guardian_and_the_link_is_texted_once_in_ten_minutes_and_audited()
    {
        var asked = await Ask(Sofia);
        var again = await Ask(Sofia);

        Assert.Equal(HttpStatusCode.Accepted, asked.StatusCode);
        Assert.Equal("•••-•••-0142", Assert.Single((await asked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("sentTo").EnumerateArray()).GetString());
        Assert.Equal(HttpStatusCode.Accepted, again.StatusCode);
        Assert.Single(Sms.Sent, s => s.To == "905-555-0142" && s.Text.Contains("/g/consent/", StringComparison.Ordinal));
        var audit = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'GuardianConsent' AND Action = 'Sent'"));
        Assert.Contains("asked by Sofía Rivera", audit, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Once_Carmen_consents_Sofias_lessons_open_without_staff()
    {
        await Ask(Sofia);
        var token = LinkPattern().Match(Sms.Sent.Last(s => s.Text.Contains("/g/consent/", StringComparison.Ordinal)).Text).Groups["token"].Value;
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code });

        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name = "Carmen Rivera", relationship = "Parent", agree = true })).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await Lessons(Sofia)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Ask(Sofia)).StatusCode);
    }

    [Fact]
    public async Task A_youth_who_needs_no_consent_or_has_no_guardian_who_may_sign_gets_no_link()
    {
        Assert.Equal(HttpStatusCode.Conflict, (await Ask(Nadia)).StatusCode);

        var carmen = Query("SELECT Id FROM Guardians WHERE Name = 'Carmen Rivera'").Single();
        await _factory.ClientFor(Tom).PutAsJsonAsync($"/guardians/{carmen}", new { name = "Carmen Rivera", relationship = "Mother", mobile = "905-555-0142", canPickUp = true, canSign = false });
        var noGuardian = await Ask(Sofia);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, noGuardian.StatusCode);
        Assert.Equal("no-guardian", (await noGuardian.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains("/g/consent/", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Raising_the_consent_age_gates_an_older_youth_from_her_next_request()
    {
        Assert.Equal(HttpStatusCode.OK, (await Lessons(Nadia)).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/consent", new { consentAge = 19, wording = "We agree that our child may join lessons and mentoring." });

        Assert.Equal(HttpStatusCode.Forbidden, (await Lessons(Nadia)).StatusCode);
    }

    [Fact]
    public async Task With_Learning_off_both_youth_endpoints_answer_404_and_staff_and_mentors_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Lessons(Tom)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Lessons(Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Ask(Tom)).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await Lessons(Sofia)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Ask(Sofia)).StatusCode);
    }

    private Task<HttpResponseMessage> Lessons(Guid membership) => _factory.ClientFor(membership).GetAsync("/learning/lessons");

    private Task<HttpResponseMessage> Ask(Guid membership) => _factory.ClientFor(membership).PostAsync("/learning/consent-request", null);

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

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

    public async Task InitializeAsync()
    {
        _guardian = _factory.CreateClient();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = WithLearning });
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
