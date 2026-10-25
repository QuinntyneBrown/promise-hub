using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-014 writing and sending a slip, L2-022 SMS cap, L2-001 tenant isolation, L2-007 roles, L2-032 audit, L2-005 Slips off.
public sealed class SlipTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private const string Intro = "We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_events_slip_opens_as_a_draft_with_who_it_will_reach()
    {
        var slip = await Slip();

        Assert.Equal("Draft", slip.GetProperty("status").GetString());
        Assert.Equal("Fall field trip: Royal Botanical Gardens", slip.GetProperty("title").GetString());
        Assert.Equal(3, slip.GetProperty("households").GetInt32());
        Assert.Equal(4, slip.GetProperty("children").GetInt32());
        Assert.Equal(0, slip.GetProperty("signed").GetInt32());
    }

    [Fact]
    public async Task A_draft_is_saved_with_its_text_questions_deadline_reminders_and_channel()
    {
        var saved = await SaveDraft();

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var slip = await Slip();
        Assert.Equal(Intro, slip.GetProperty("body").GetString());
        Assert.Equal("2026-11-12", slip.GetProperty("signBy").GetString());
        Assert.True(slip.GetProperty("askPhotos").GetBoolean());
        Assert.False(slip.GetProperty("askSwimming").GetBoolean());
        Assert.Equal("TwiceWeekly", slip.GetProperty("reminders").GetString());
        Assert.Equal("TextAndEmail", slip.GetProperty("channel").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'PermissionSlip' AND Action = 'Updated'"));
    }

    [Fact]
    public async Task A_slip_without_text_or_with_a_deadline_after_the_event_is_not_sent()
    {
        await SaveDraft(body: "", signBy: "2026-11-20");

        var response = await Post($"/slips/{await SlipId()}/send", new { });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the slip text.", errors.GetProperty("body").GetString());
        Assert.Equal("Must be before Sat 14 Nov.", errors.GetProperty("signBy").GetString());
        Assert.Empty(Query("SELECT Id FROM Deliveries"));
    }

    [Fact]
    public async Task Sending_queues_one_message_per_household_and_the_event_shows_none_signed_yet()
    {
        await SaveDraft();

        var sent = await Post($"/slips/{await SlipId()}/send", new { });

        Assert.Equal(HttpStatusCode.NoContent, sent.StatusCode);
        var slip = await Slip();
        Assert.Equal("Sent", slip.GetProperty("status").GetString());
        Assert.Equal(0, slip.GetProperty("signed").GetInt32());
        Assert.Equal(4, slip.GetProperty("outstanding").GetInt32());
        Assert.Equal(3, Query("SELECT Id FROM Deliveries").Count);
        Assert.Equal("Sent", (await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}")).GetProperty("slipStatus").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'PermissionSlip' AND Action = 'Sent'"));

        await RunJob();

        Assert.Equal(3, Sms.Sent.Count);
        Assert.Contains(Sms.Sent, s => s.Text.Contains("Please sign the permission slip for “Fall field trip: Royal Botanical Gardens” by Thu 12 Nov.", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_scheduled_send_goes_out_at_its_time_unless_cancelled_and_can_be_sent_now()
    {
        await SaveDraft();
        var id = await SlipId();

        await Post($"/slips/{id}/send", new { at = "2026-11-06T22:00:00Z" });
        Assert.Equal("Scheduled", (await Slip()).GetProperty("status").GetString());
        await RunJob();
        Assert.Empty(Sms.Sent);

        _factory.Clock.Advance(TimeSpan.FromDays(2));
        await RunJob();
        await RunJob();

        Assert.Equal("Sent", (await Slip()).GetProperty("status").GetString());
        Assert.Equal(3, Sms.Sent.Count);
    }

    [Fact]
    public async Task Cancelling_a_scheduled_send_keeps_the_draft_and_sends_nothing()
    {
        await SaveDraft();
        var id = await SlipId();
        await Post($"/slips/{id}/send", new { at = "2026-11-06T22:00:00Z" });

        Assert.Equal(HttpStatusCode.NoContent, (await Post($"/slips/{id}/cancel-send", new { })).StatusCode);
        _factory.Clock.Advance(TimeSpan.FromDays(2));
        await RunJob();

        Assert.Equal("Draft", (await Slip()).GetProperty("status").GetString());
        Assert.Empty(Sms.Sent);
        Assert.Equal(HttpStatusCode.Conflict, (await Post($"/slips/{id}/send-now", new { })).StatusCode);
    }

    [Fact]
    public async Task Send_now_sends_a_scheduled_slip_at_once()
    {
        await SaveDraft();
        var id = await SlipId();
        await Post($"/slips/{id}/send", new { at = "2026-11-06T22:00:00Z" });

        Assert.Equal(HttpStatusCode.NoContent, (await Post($"/slips/{id}/send-now", new { })).StatusCode);

        Assert.Equal("Sent", (await Slip()).GetProperty("status").GetString());
        Assert.Equal(3, Query("SELECT Id FROM Deliveries").Count);
    }

    [Fact]
    public async Task Signed_declined_and_outstanding_are_tracked_per_child()
    {
        await SaveDraft();
        var id = await SlipId();
        await Post($"/slips/{id}/send", new { });
        Sign(id, Mateo, "Signed", version: 1);
        Sign(id, Jordan, "Declined", version: 1);

        var slip = await Slip();

        Assert.Equal(1, slip.GetProperty("signed").GetInt32());
        Assert.Equal(1, slip.GetProperty("declined").GetInt32());
        Assert.Equal(2, slip.GetProperty("outstanding").GetInt32());
        var mateo = slip.GetProperty("responses").EnumerateArray().Single(r => r.GetProperty("child").GetString() == "Mateo Rivera");
        Assert.Equal("Signed", mateo.GetProperty("status").GetString());
        var row = Assert.Single((await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/slips")).GetProperty("slips").EnumerateArray());
        Assert.Equal(1, row.GetProperty("signed").GetInt32());
        Assert.Equal(4, row.GetProperty("children").GetInt32());
    }

    [Fact]
    public async Task A_small_edit_keeps_signatures_and_a_material_edit_reopens_signing_and_tells_guardians()
    {
        await SaveDraft();
        var id = await SlipId();
        await Post($"/slips/{id}/send", new { });
        Sign(id, Mateo, "Signed", version: 1);

        await Put($"/slips/{id}", new { title = "Fall field trip: Royal Botanical Gardens", body = Intro + " Typo fixed.", signBy = "2026-11-12", material = false });
        Assert.Equal(1, (await Slip()).GetProperty("signed").GetInt32());
        Assert.Single(Query("SELECT Id FROM Messages"));

        var material = await Put($"/slips/{id}", new { title = "Fall field trip: Royal Botanical Gardens", body = Intro + " We will also swim.", signBy = "2026-11-12", material = true });

        Assert.Equal(HttpStatusCode.NoContent, material.StatusCode);
        var slip = await Slip();
        Assert.Equal(2, slip.GetProperty("version").GetInt32());
        Assert.Equal(0, slip.GetProperty("signed").GetInt32());
        Assert.Equal(4, slip.GetProperty("outstanding").GetInt32());
        Assert.Equal(2, Query("SELECT Id FROM Messages").Count);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'PermissionSlip' AND Summary LIKE '%material%'"));
    }

    [Fact]
    public async Task At_the_SMS_cap_the_sender_sees_which_households_got_email_only()
    {
        Execute($"INSERT INTO SmsUsagePeriods (Id, OrganizationId, Period, Cap, Used) VALUES ('{Guid.NewGuid().ToString().ToUpperInvariant()}', '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}', '2026-11', 2000, 2000)");
        await SaveDraft();
        await Post($"/slips/{await SlipId()}/send", new { });

        await RunJob();

        Assert.Empty(Sms.Sent);
        var delivery = (await Slip()).GetProperty("delivery");
        Assert.Equal(["Haddad", "Rivera", "Thompson"], delivery.GetProperty("emailInstead").EnumerateArray().Select(h => h.GetString()));
    }

    [Fact]
    public async Task Volunteer_coordinators_read_slips_but_cannot_write_or_send_them()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(PriyaAtHarbourview).GetAsync($"/events/{FieldTrip}/slip")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(PriyaAtHarbourview).PutAsJsonAsync($"/events/{FieldTrip}/slip", Draft(Intro, "2026-11-12"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(PriyaAtHarbourview).PostAsJsonAsync($"/slips/{await SlipId()}/send", new { })).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_slip_is_never_found()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/events/{FieldTrip}/slip")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/slips/{await SlipId()}/send", new { })).StatusCode);
        Assert.Empty((await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/slips")).GetProperty("slips").EnumerateArray());
    }

    [Fact]
    public async Task With_Slips_off_the_endpoints_answer_404_and_a_scheduled_slip_is_not_sent()
    {
        await SaveDraft();
        await Post($"/slips/{await SlipId()}/send", new { at = "2026-11-06T22:00:00Z" });
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Messages" } });

        _factory.Clock.Advance(TimeSpan.FromDays(2));
        await RunJob();

        Assert.Empty(Sms.Sent);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/slips")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/events/{FieldTrip}/slip")).StatusCode);
    }

    private static object Draft(string body, string signBy) => new
    {
        title = "Fall field trip: Royal Botanical Gardens",
        body,
        signBy,
        askPhotos = true,
        askSwimming = false,
        askLunch = true,
        reminders = "TwiceWeekly",
        channel = "TextAndEmail",
    };

    private Task<HttpResponseMessage> SaveDraft(string body = Intro, string signBy = "2026-11-12") =>
        _factory.ClientFor(Marisol).PutAsJsonAsync($"/events/{FieldTrip}/slip", Draft(body, signBy));

    private async Task<JsonElement> Slip() => await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}/slip");

    private async Task<Guid> SlipId() => (await Slip()).GetProperty("id").GetGuid();

    private Task<HttpResponseMessage> Post(string path, object body) => _factory.ClientFor(Marisol).PostAsJsonAsync(path, body);

    private Task<HttpResponseMessage> Put(string path, object body) => _factory.ClientFor(Marisol).PutAsJsonAsync(path, body);

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private void Sign(Guid slipId, Guid childId, string status, int version) =>
        Execute($"INSERT INTO SlipSignatures (Id, OrganizationId, SlipId, ChildId, Version, Status, SignedBy, At) VALUES ('{Guid.NewGuid().ToString().ToUpperInvariant()}', '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}', '{slipId.ToString().ToUpperInvariant()}', '{childId.ToString().ToUpperInvariant()}', {version}, '{status}', 'Carmen Rivera', 0)");

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
