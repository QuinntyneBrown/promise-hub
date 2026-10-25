using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-016 reminders and day-of status, L2-022 SMS cap, L2-034 jobs, L2-007 roles, L2-001 tenant isolation, L2-032 audit, L2-005 Slips off.
public sealed class SlipReminderTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid TonightId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task On_its_schedule_the_job_reminds_only_unsigned_households_once_per_slot_with_their_links()
    {
        var slipId = await SendSlipWithAnswers();
        Sms.Clear();

        await RunJob();
        Assert.Empty(Sms.Sent);

        // Tuesday 10 November, 6:30 pm in Hamilton: the first twice-weekly slot after the send.
        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 10, 23, 30, 0, TimeSpan.Zero));
        await RunJob();
        await RunJob();

        Assert.Equal(2, Sms.Sent.Count);
        Assert.Contains(Sms.Sent, s => s.To == "905-555-0142" && s.Text.Contains("Reminder", StringComparison.Ordinal) && s.Text.Contains("Sofía: ", StringComparison.Ordinal) && !s.Text.Contains("Mateo: ", StringComparison.Ordinal));
        Assert.DoesNotContain(Sms.Sent, s => s.To == "905-555-0117");
        Assert.Equal(2, Query($"SELECT Id FROM SlipReminders WHERE SlipId = '{Upper(slipId)}' AND Kind = 'Scheduled'").Count);
    }

    [Fact]
    public async Task A_household_with_a_bounced_email_and_no_mobile_is_listed_as_unreachable_instead_of_retried()
    {
        var slipId = await SendSlipWithAnswers();
        Execute("UPDATE Guardians SET Mobile = NULL, EmailBounced = 1 WHERE Name = 'Nour Haddad'");
        Sms.Clear();

        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 10, 23, 30, 0, TimeSpan.Zero));
        await RunJob();

        Assert.DoesNotContain(Sms.Sent, s => s.To == "905-555-0128");
        var unsigned = await Get($"/slips/{slipId}/unsigned");
        var haddad = unsigned.GetProperty("households").EnumerateArray().Single(h => h.GetProperty("household").GetString() == "Haddad");
        Assert.False(haddad.GetProperty("reachable").GetBoolean());
        Assert.Equal("Email bounced, no mobile", haddad.GetProperty("reason").GetString());
        Assert.Single(Query("SELECT Id FROM SlipReminders WHERE Unreachable = 1"));
    }

    [Fact]
    public async Task A_manual_reminder_fills_in_each_familys_children_and_links()
    {
        var slipId = await SendSlipWithAnswers();
        Sms.Clear();

        var missing = await Post(Marisol, $"/slips/{slipId}/remind", new { body = "Reminder: sign {child}’s RBG slip by Thursday." });
        Assert.Equal("Keep {link} in the message.", (await Errors(missing)).GetProperty("body").GetString());

        var sent = await Post(Marisol, $"/slips/{slipId}/remind", new { body = "Reminder: sign {child}’s RBG slip by Thursday: {link}" });
        await RunJob();

        Assert.Equal(HttpStatusCode.OK, sent.StatusCode);
        Assert.Equal(2, (await sent.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("households").GetInt32());
        Assert.Contains(Sms.Sent, s => s.To == "905-555-0142" && s.Text.Contains("Reminder: sign Sofía’s RBG slip by Thursday: http", StringComparison.Ordinal) && s.Text.Contains("/g/slip/", StringComparison.Ordinal));
        Assert.Equal(2, Query("SELECT Id FROM SlipReminders WHERE Kind = 'Manual'").Count);
    }

    [Fact]
    public async Task On_the_day_the_roster_shows_cleared_missing_and_declined_with_the_missing_first()
    {
        await SendSlipWithAnswers();

        var clearance = await Get($"/sessions/{FieldTrip}/clearance");

        Assert.Equal(1, clearance.GetProperty("cleared").GetInt32());
        Assert.Equal(2, clearance.GetProperty("missing").GetInt32());
        Assert.Equal(1, clearance.GetProperty("declined").GetInt32());
        var children = clearance.GetProperty("children").EnumerateArray().ToList();
        Assert.Equal(["Missing", "Missing", "Declined", "Cleared"], children.Select(c => c.GetProperty("status").GetString()));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync($"/sessions/{TonightId}/clearance")).StatusCode);
    }

    [Fact]
    public async Task A_guardian_signing_on_the_staff_tablet_clears_the_children_at_once_and_gets_a_copy()
    {
        var slipId = await SendSlipWithAnswers();
        var rivera = Query("SELECT Id FROM Households WHERE Name = 'Rivera' AND OrganizationId = '" + Upper(DatabaseSeeder.Harbourview) + "'").Single();
        var messagesBefore = Query("SELECT Id FROM Messages").Count;

        var wrong = await Post(Jaylen, $"/slips/{slipId}/sign-on-tablet", new { householdId = rivera, name = "Linh Tran", photos = true });
        Assert.Equal("That name doesn’t match a guardian of this family.", (await Errors(wrong)).GetProperty("name").GetString());

        var signed = await Post(Jaylen, $"/slips/{slipId}/sign-on-tablet", new { householdId = rivera, name = "Carmen Rivera", photos = true });

        Assert.Equal(HttpStatusCode.NoContent, signed.StatusCode);
        var sofia = (await Get($"/sessions/{FieldTrip}/clearance")).GetProperty("children").EnumerateArray().Single(c => c.GetProperty("name").GetString() == "Sofía Rivera");
        Assert.Equal("Cleared", sofia.GetProperty("status").GetString());
        Assert.Contains("Staff tablet", Query("SELECT Device FROM SlipSignatures WHERE SignedBy = 'Carmen Rivera' AND Device LIKE 'Staff tablet%'").Single(), StringComparison.Ordinal);
        Assert.Contains("Jaylen Okafor", Query("SELECT Device FROM SlipSignatures WHERE Device LIKE 'Staff tablet%'").Single(), StringComparison.Ordinal);
        Assert.Equal(messagesBefore + 1, Query("SELECT Id FROM Messages").Count);
    }

    [Fact]
    public async Task Volunteer_coordinators_cannot_remind_or_sign_on_the_tablet()
    {
        var slipId = await SendSlipWithAnswers();

        Assert.Equal(HttpStatusCode.Forbidden, (await Post(PriyaAtHarbourview, $"/slips/{slipId}/remind", new { body = "{link}" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(PriyaAtHarbourview, $"/slips/{slipId}/sign-on-tablet", new { householdId = Guid.NewGuid(), name = "Carmen Rivera" })).StatusCode);
    }

    [Fact]
    public async Task Another_organization_never_sees_the_clearance_or_reminds()
    {
        var slipId = await SendSlipWithAnswers();
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Slips" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/sessions/{FieldTrip}/clearance")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, $"/slips/{slipId}/remind", new { body = "{link}" })).StatusCode);
    }

    [Fact]
    public async Task With_Slips_off_there_is_no_clearance_and_the_reminder_job_sends_nothing()
    {
        await SendSlipWithAnswers();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Messages" } });
        Sms.Clear();

        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 10, 23, 30, 0, TimeSpan.Zero));
        await RunJob();

        Assert.Empty(Sms.Sent);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync($"/sessions/{FieldTrip}/clearance")).StatusCode);
    }

    /// <summary>Sends the field trip slip with twice-weekly reminders; Mateo is signed and Jordan declined.</summary>
    private async Task<Guid> SendSlipWithAnswers()
    {
        var staff = _factory.ClientFor(Marisol);
        await staff.PutAsJsonAsync($"/events/{FieldTrip}/slip", new
        {
            title = "Fall field trip: Royal Botanical Gardens",
            body = "We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November.",
            signBy = "2026-11-12",
            askPhotos = true,
            askSwimming = false,
            askLunch = true,
            reminders = "TwiceWeekly",
            channel = "TextAndEmail",
        });
        var slipId = (await Get($"/events/{FieldTrip}/slip")).GetProperty("id").GetGuid();
        await staff.PostAsJsonAsync($"/slips/{slipId}/send", new { });
        await RunJob();
        Sign(slipId, Mateo, "Signed");
        Sign(slipId, Jordan, "Declined");
        return slipId;
    }

    private async Task<JsonElement> Get(string path) => await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>(path);

    private Task<HttpResponseMessage> Post(Guid membership, string path, object body) => _factory.ClientFor(membership).PostAsJsonAsync(path, body);

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

    private void Sign(Guid slipId, Guid childId, string status) =>
        Execute($"INSERT INTO SlipSignatures (Id, OrganizationId, SlipId, ChildId, Version, Status, SignedBy, At) VALUES ('{Upper(Guid.NewGuid())}', '{Upper(DatabaseSeeder.Harbourview)}', '{Upper(slipId)}', '{Upper(childId)}', 1, '{status}', 'Carmen Rivera', 0)");

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
