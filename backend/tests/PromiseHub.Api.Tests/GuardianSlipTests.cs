using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-015 signing a slip, L2-026 guardian links and codes, L2-027 language, L2-032 audit, L2-001 tenant isolation, L2-005 Slips off.
public sealed partial class GuardianSlipTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private const string Intro = "We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November.";

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task A_slip_link_on_a_new_device_asks_for_a_code_in_the_households_language()
    {
        var links = await SendSlip();

        var response = await _guardian.GetAsync($"/g/slips/{links["Mateo"]}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("verification-required", body.GetProperty("code").GetString());
        Assert.Equal("es", body.GetProperty("language").GetString());
        Assert.Equal("Harbourview Youth Collective", body.GetProperty("organization").GetString());
    }

    [Fact]
    public async Task A_code_goes_only_to_a_contact_on_file_and_the_answer_never_tells_which()
    {
        var links = await SendSlip();

        var unknown = await _guardian.PostAsJsonAsync("/g/auth/code", new { token = links["Mateo"], contact = "905-555-9999" });
        var known = await _guardian.PostAsJsonAsync("/g/auth/code", new { token = links["Mateo"], contact = "(905) 555-0142" });

        Assert.Equal(HttpStatusCode.Accepted, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, known.StatusCode);
        Assert.Single(Sms.Sent, s => s.To == "905-555-0142" && s.Text.Contains("code is", StringComparison.Ordinal));
        Assert.DoesNotContain(Sms.Sent, s => s.To == "905-555-9999");
    }

    [Fact]
    public async Task A_verified_device_reads_the_slip_prefilled_and_opens_the_households_other_links_without_a_code()
    {
        var links = await SendSlip();

        await Verify(links["Mateo"]);
        var slip = await _guardian.GetFromJsonAsync<JsonElement>($"/g/slips/{links["Mateo"]}");
        var sofia = await _guardian.GetAsync($"/g/slips/{links["Sofía"]}");

        Assert.Equal("Mateo Rivera", slip.GetProperty("child").GetProperty("name").GetString());
        Assert.Equal("Peanuts (anaphylaxis); tree nuts (hives)", slip.GetProperty("child").GetProperty("allergies").GetString());
        Assert.Equal("Fall field trip: Royal Botanical Gardens", slip.GetProperty("event").GetProperty("name").GetString());
        Assert.Equal("2026-11-12", slip.GetProperty("signBy").GetString());
        Assert.Equal(Intro, slip.GetProperty("body").GetString());
        Assert.True(slip.GetProperty("askPhotos").GetBoolean());
        Assert.Equal("Open", slip.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", slip.GetProperty("emergencyContact").GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.OK, sofia.StatusCode);
    }

    [Fact]
    public async Task Three_wrong_codes_lock_the_link_for_15_minutes_and_a_code_expires_after_10()
    {
        var links = await SendSlip();
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token = links["Mateo"], contact = "905-555-0142" });
        var code = LastCode();

        for (var i = 0; i < 3; i++)
        {
            Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _guardian.PostAsJsonAsync("/g/auth/verify", new { token = links["Mateo"], code = "000000" })).StatusCode);
        }
        var locked = await _guardian.PostAsJsonAsync("/g/auth/verify", new { token = links["Mateo"], code });
        Assert.Equal((HttpStatusCode)423, locked.StatusCode);

        _factory.Clock.Advance(TimeSpan.FromMinutes(16));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _guardian.PostAsJsonAsync("/g/auth/verify", new { token = links["Mateo"], code })).StatusCode);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'GuardianLink' AND Summary LIKE '%locked%'"));
    }

    [Fact]
    public async Task Signing_with_a_guardians_typed_name_records_name_time_device_language_and_the_text_hash()
    {
        var links = await SendSlip();
        await Verify(links["Mateo"]);
        _guardian.DefaultRequestHeaders.UserAgent.ParseAdd("CarmenPhone/1.0");

        var signed = await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/sign", new { name = "  carmen rivera ", photos = true, lunch = "pack" });

        Assert.Equal(HttpStatusCode.NoContent, signed.StatusCode);
        var row = Assert.Single(Query("SELECT SignedBy, Language, Device, TextHash, Status FROM SlipSignatures")).Split('|');
        Assert.Equal("Carmen Rivera", row[0]);
        Assert.Equal("Spanish", row[1]);
        Assert.Contains("CarmenPhone/1.0", row[2], StringComparison.Ordinal);
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Intro))), row[3]);
        Assert.Equal("Signed", row[4]);
        var staff = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}/slip");
        Assert.Equal(1, staff.GetProperty("signed").GetInt32());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'PermissionSlip' AND Action = 'Signed'"));
        Assert.Equal("Signed", (await _guardian.GetFromJsonAsync<JsonElement>($"/g/slips/{links["Mateo"]}")).GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/sign", new { name = "Carmen Rivera" })).StatusCode);
    }

    [Fact]
    public async Task A_name_that_is_no_guardian_of_the_child_or_no_name_is_refused_inline()
    {
        var links = await SendSlip();
        await Verify(links["Mateo"]);

        var stranger = await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/sign", new { name = "Dana Thompson" });
        var empty = await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/sign", new { name = "" });

        Assert.Equal("That name doesn’t match a guardian of Mateo.", (await Errors(stranger)).GetProperty("name").GetString());
        Assert.Equal("Type your full name to sign.", (await Errors(empty)).GetProperty("name").GetString());
        Assert.Empty(Query("SELECT Id FROM SlipSignatures"));
    }

    [Fact]
    public async Task Declining_with_a_reason_shows_the_child_as_declined()
    {
        var links = await SendSlip();
        await Verify(links["Mateo"]);

        var declined = await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/decline", new { name = "Carmen Rivera", reason = "Family trip that weekend" });

        Assert.Equal(HttpStatusCode.NoContent, declined.StatusCode);
        var staff = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}/slip");
        Assert.Equal(1, staff.GetProperty("declined").GetInt32());
        Assert.Equal("Family trip that weekend", Query("SELECT Reason FROM SlipSignatures").Single());
    }

    [Fact]
    public async Task Once_the_event_has_started_the_slip_is_closed_and_a_month_after_the_deadline_the_link_has_expired()
    {
        var links = await SendSlip();
        await Verify(links["Mateo"]);

        _factory.Clock.Advance(TimeSpan.FromDays(9));
        Assert.Equal("Closed", (await _guardian.GetFromJsonAsync<JsonElement>($"/g/slips/{links["Mateo"]}")).GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/sign", new { name = "Carmen Rivera" })).StatusCode);

        _factory.Clock.Advance(TimeSpan.FromDays(30));
        var expired = await _guardian.GetAsync($"/g/slips/{links["Mateo"]}");
        Assert.Equal(HttpStatusCode.Gone, expired.StatusCode);
        Assert.Equal("905-555-0100", (await expired.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("phone").GetString());
    }

    [Fact]
    public async Task An_unknown_link_is_gone_and_a_contact_change_revokes_the_households_links()
    {
        var links = await SendSlip();
        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync("/g/slips/not-a-real-token")).StatusCode);
        var carmen = Query("SELECT Id FROM Guardians WHERE Name = 'Carmen Rivera'").Single();

        await _factory.ClientFor(Tom).PutAsJsonAsync($"/guardians/{carmen}", new { name = "Carmen Rivera", relationship = "Mother", mobile = "905-555-0177", canPickUp = true, canSign = true });

        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync($"/g/slips/{links["Mateo"]}")).StatusCode);
    }

    [Fact]
    public async Task With_Slips_off_a_slip_link_answers_404()
    {
        var links = await SendSlip();
        await Verify(links["Mateo"]);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Messages" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.GetAsync($"/g/slips/{links["Mateo"]}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.PostAsJsonAsync($"/g/slips/{links["Mateo"]}/sign", new { name = "Carmen Rivera" })).StatusCode);
    }

    [Fact]
    public async Task A_trusted_device_never_opens_another_households_links()
    {
        var links = await SendSlip();
        await Verify(links["Mateo"]);

        var thompson = await _guardian.GetAsync($"/g/slips/{links["Jordan"]}");

        Assert.Equal(HttpStatusCode.Unauthorized, thompson.StatusCode);
    }

    /// <summary>Writes and sends the field trip slip, runs the send job, and returns each child's link token from the texts.</summary>
    private async Task<Dictionary<string, string>> SendSlip()
    {
        var staff = _factory.ClientFor(Marisol);
        await staff.PutAsJsonAsync($"/events/{FieldTrip}/slip", new
        {
            title = "Fall field trip: Royal Botanical Gardens",
            body = Intro,
            signBy = "2026-11-12",
            askPhotos = true,
            askSwimming = false,
            askLunch = true,
            reminders = "TwiceWeekly",
            channel = "TextAndEmail",
        });
        var slipId = (await staff.GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}/slip")).GetProperty("id").GetGuid();
        await staff.PostAsJsonAsync($"/slips/{slipId}/send", new { });
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        return Sms.Sent.SelectMany(s => LinkPattern().Matches(s.Text)).ToDictionary(m => m.Groups["child"].Value, m => m.Groups["token"].Value);
    }

    private async Task Verify(string token)
    {
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var verified = await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code = LastCode() });
        Assert.Equal(HttpStatusCode.NoContent, verified.StatusCode);
    }

    private string LastCode() => CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"(?<child>[\p{L}]+): \S+/g/slip/(?<token>[A-Za-z0-9_-]+)")]
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
