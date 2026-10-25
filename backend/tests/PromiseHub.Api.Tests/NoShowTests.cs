using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-018 criteria 1 to 3 no-show alerts and replies, L2-022 SMS cap, L2-034 background jobs, L2-001 tenant isolation, L2-005 Roll Call off.
public sealed partial class NoShowTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private const string Alert = "Reply 1 if on the way, 2 if absent.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Fifteen_minutes_after_start_each_household_of_a_child_not_checked_in_gets_one_text()
    {
        await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() });

        await RunJob();
        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains(Alert, StringComparison.Ordinal));
        _factory.Clock.Advance(TimeSpan.FromMinutes(4));
        await RunJob();
        await RunJob();

        var alerts = Sms.Sent.Where(s => s.Text.Contains(Alert, StringComparison.Ordinal)).ToList();
        Assert.Single(alerts, s => s.To == "905-555-0142");
        Assert.Contains("Sofía", alerts.Single(s => s.To == "905-555-0142").Text, StringComparison.Ordinal);
        Assert.DoesNotContain("Mateo", alerts.Single(s => s.To == "905-555-0142").Text, StringComparison.Ordinal);
        var roster = await Roster();
        Assert.Equal("TextSent", Row(roster, "Sofía Rivera").GetProperty("noShow").GetString());
        Assert.Equal(JsonValueKind.Null, Row(roster, "Mateo Rivera").GetProperty("noShow").ValueKind);
    }

    [Fact]
    public async Task A_reply_of_2_marks_the_child_absent_and_1_says_on_the_way()
    {
        _factory.Clock.Advance(TimeSpan.FromMinutes(4));
        await RunJob();

        var absent = await Reply("905-555-0142", " 2 ");
        var onTheWay = await Reply(PhoneOf("Jordan Thompson"), "1");

        Assert.Equal(HttpStatusCode.OK, absent.StatusCode);
        Assert.Equal(HttpStatusCode.OK, onTheWay.StatusCode);
        var roster = await Roster();
        Assert.Equal("Absent", Row(roster, "Sofía Rivera").GetProperty("status").GetString());
        Assert.Equal("Absent", Row(roster, "Sofía Rivera").GetProperty("noShow").GetString());
        Assert.Equal("NotYet", Row(roster, "Jordan Thompson").GetProperty("status").GetString());
        Assert.Equal("OnTheWay", Row(roster, "Jordan Thompson").GetProperty("noShow").GetString());
        Assert.Equal("Absent", Row(roster, "Mateo Rivera").GetProperty("status").GetString());
        Assert.Equal(2, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance' AND Summary LIKE '%guardian replied%'").Count);
    }

    [Fact]
    public async Task A_reply_needs_the_shared_secret_and_a_number_with_no_alert_changes_nothing()
    {
        _factory.Clock.Advance(TimeSpan.FromMinutes(4));
        await RunJob();
        var anonymous = _factory.CreateClient();

        var unsigned = await anonymous.PostAsJsonAsync("/webhooks/sms/inbound", new { from = "905-555-0142", text = "2" });
        var stranger = await Reply("289-555-0101", "2");

        Assert.Equal(HttpStatusCode.Unauthorized, unsigned.StatusCode);
        Assert.Equal(HttpStatusCode.OK, stranger.StatusCode);
        Assert.Equal("NotYet", Row(await Roster(), "Sofía Rivera").GetProperty("status").GetString());
    }

    [Fact]
    public async Task No_text_when_the_event_switch_is_off_or_Roll_Call_is_off()
    {
        Execute($"UPDATE Events SET NoShowAlert = 0 WHERE Id = '{Tonight.ToString().ToUpperInvariant()}'");
        _factory.Clock.Advance(TimeSpan.FromMinutes(4));
        await RunJob();
        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains(Alert, StringComparison.Ordinal));

        Execute($"UPDATE Events SET NoShowAlert = 1 WHERE Id = '{Tonight.ToString().ToUpperInvariant()}'");
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages" } });
        await RunJob();
        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains(Alert, StringComparison.Ordinal));
    }

    [Fact]
    public async Task The_text_links_to_the_home_where_the_guardian_answers_instead_of_replying()
    {
        _factory.Clock.Advance(TimeSpan.FromMinutes(4));
        await RunJob();
        var token = HomeLink().Match(Sms.Sent.Single(s => s.To == "905-555-0142" && s.Text.Contains(Alert, StringComparison.Ordinal)).Text).Groups["token"].Value;
        var guardian = _factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await guardian.PostAsJsonAsync($"/g/home/{token}/no-show", new { eventId = Tonight, reply = "Absent" })).StatusCode);
        await guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        await guardian.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value });
        var home = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");
        var alert = home.GetProperty("noShows").EnumerateArray().Single();
        Assert.Equal("Tutoring night", alert.GetProperty("event").GetString());
        Assert.Equal(["Mateo", "Sofía"], alert.GetProperty("children").EnumerateArray().Select(c => c.GetString()));

        var answered = await guardian.PostAsJsonAsync($"/g/home/{token}/no-show", new { eventId = Tonight, reply = "Absent" });

        Assert.Equal(HttpStatusCode.NoContent, answered.StatusCode);
        Assert.Equal("Absent", Row(await Roster(), "Sofía Rivera").GetProperty("noShow").GetString());
        Assert.Empty((await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}")).GetProperty("noShows").EnumerateArray());
    }

    [System.Text.RegularExpressions.GeneratedRegex(@"/g/home/(?<token>[A-Za-z0-9_-]+)")]
    private static partial System.Text.RegularExpressions.Regex HomeLink();

    [System.Text.RegularExpressions.GeneratedRegex(@"\b\d{6}\b")]
    private static partial System.Text.RegularExpressions.Regex CodePattern();

    private static JsonElement Row(JsonElement roster, string name) =>
        roster.GetProperty("children").EnumerateArray().Single(r => r.GetProperty("name").GetString() == name);

    private async Task<JsonElement> Roster() => await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/sessions/{Tonight}/roster");

    private Task<HttpResponseMessage> Reply(string from, string text)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Webhook-Secret", ApiFactoryBase.InboundSmsSecret);
        return client.PostAsJsonAsync("/webhooks/sms/inbound", new { from, text });
    }

    private string PhoneOf(string child) =>
        Query($"SELECT g.Mobile FROM Guardians g JOIN Children c ON c.HouseholdId = g.HouseholdId WHERE c.FirstName || ' ' || c.LastName = '{child}' AND g.IsPrimary = 1").Single();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        Assert.Equal(1, command.ExecuteNonQuery());
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

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
