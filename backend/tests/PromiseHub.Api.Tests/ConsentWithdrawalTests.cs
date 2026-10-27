using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-058 criterion 2 withdrawal, L2-057 criteria 2 and 3 a withdrawal gates the youth at once and the record is kept,
// L2-032 audit, L2-001 tenant isolation, L2-005 Roster off.
public sealed partial class ConsentWithdrawalTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly string[] WithLearning = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;
    private HttpClient _sofia = null!;

    [Fact]
    public async Task Withdrawing_gates_Sofia_on_her_next_request_keeps_the_record_and_is_audited()
    {
        var token = await Consented();
        Assert.Equal(HttpStatusCode.OK, (await _sofia.GetAsync("/learning/home")).StatusCode);

        var withdrawn = await Withdraw(token);

        Assert.Equal(HttpStatusCode.NoContent, withdrawn.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _sofia.GetAsync("/learning/home")).StatusCode);
        var row = Assert.Single(Query("SELECT SignedBy, WithdrawnBy, WithdrawnAt IS NOT NULL FROM GuardianConsents")).Split('|');
        Assert.Equal(("Carmen Rivera", "Carmen Rivera", "1"), (row[0], row[1], row[2]));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianConsent' AND Action = 'Withdrawn'"));
        var page = await _guardian.GetFromJsonAsync<JsonElement>($"/g/consent/{token}");
        Assert.Equal("Withdrawn", page.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", page.GetProperty("withdrawnBy").GetString());
        var staff = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{SofiaChild}/consent");
        Assert.Equal("Withdrawn", staff.GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_withdrawal_with_no_consent_in_force_is_a_conflict()
    {
        var token = await Consented();
        await Withdraw(token);

        Assert.Equal(HttpStatusCode.Conflict, (await Withdraw(token)).StatusCode);
    }

    [Fact]
    public async Task After_a_withdrawal_a_guardian_can_consent_again_from_the_same_link_as_a_new_record()
    {
        var token = await Consented();
        await Withdraw(token);

        Assert.Equal(HttpStatusCode.NoContent, (await Sign(token)).StatusCode);

        Assert.Equal(2, Query("SELECT Id FROM GuardianConsents").Count);
        Assert.Equal(HttpStatusCode.OK, (await _sofia.GetAsync("/learning/home")).StatusCode);
    }

    [Fact]
    public async Task A_new_device_cannot_withdraw_and_with_Roster_off_withdrawal_answers_404()
    {
        var token = await Consented();
        var stranger = _factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await stranger.PostAsJsonAsync($"/g/consent/{token}/withdraw", new { })).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.NotFound, (await Withdraw(token)).StatusCode);
        Assert.Empty(Query("SELECT Id FROM GuardianConsents WHERE WithdrawnAt IS NOT NULL"));
    }

    [Fact]
    public async Task Northgates_audit_log_never_lists_Harbourviews_consents()
    {
        var token = await Consented();
        await Withdraw(token);

        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianConsent' AND OrganizationId = '{DatabaseSeeder.Northgate.ToString().ToUpperInvariant()}'"));
        Assert.Equal(3, Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianConsent' AND OrganizationId = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'").Count);
    }

    /// <summary>Sofía asks; Carmen verifies the link and consents; returns the link token.</summary>
    private async Task<string> Consented()
    {
        Assert.Equal(HttpStatusCode.Accepted, (await _sofia.PostAsync("/learning/consent-request", null)).StatusCode);
        var token = LinkPattern().Match(Sms.Sent.Last(s => s.Text.Contains("/g/consent/", StringComparison.Ordinal)).Text).Groups["token"].Value;
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code });
        Assert.Equal(HttpStatusCode.NoContent, (await Sign(token)).StatusCode);
        return token;
    }

    private Task<HttpResponseMessage> Sign(string token) =>
        _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name = "Carmen Rivera", relationship = "Parent", agree = true });

    private Task<HttpResponseMessage> Withdraw(string token) =>
        _guardian.PostAsJsonAsync($"/g/consent/{token}/withdraw", new { });

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
        _sofia = _factory.ClientFor(Sofia);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = WithLearning });
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
