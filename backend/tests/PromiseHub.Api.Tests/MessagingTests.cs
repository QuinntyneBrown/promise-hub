using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-021 composing and sending, L2-022 SMS cap, L2-034 background jobs, L2-001 tenant isolation, L2-007 roles, L2-005 Messages off.
public sealed class MessagingTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private const string Reminder = "Reminder: RBG trip is Sat 14 Nov. Bus leaves 8:45 am sharp. Pack a nut-free lunch and a rain jacket.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_preview_counts_households_by_channel_with_the_sms_segments_and_the_cap()
    {
        var preview = await Preview(new { programId = Tutoring, body = Reminder, channel = "TextWithEmailFallback" });

        Assert.Equal(3, preview.GetProperty("recipientCount").GetInt32());
        Assert.Equal(3, preview.GetProperty("textCount").GetInt32());
        Assert.Equal(0, preview.GetProperty("emailCount").GetInt32());
        Assert.Equal(1, preview.GetProperty("segments").GetInt32());
        Assert.Equal(3, preview.GetProperty("totalSegments").GetInt32());
        Assert.Equal(2000, preview.GetProperty("remainingSegments").GetInt32());
        Assert.Equal(0, preview.GetProperty("fallingBackToEmail").GetInt32());
    }

    [Fact]
    public async Task The_audience_narrows_by_event_and_language_and_counts_households_it_cannot_reach()
    {
        Assert.Equal(3, (await Preview(new { eventId = FieldTrip, body = "Hi", channel = "TextOnly" })).GetProperty("recipientCount").GetInt32());
        Assert.Equal(1, (await Preview(new { programId = Tutoring, language = "Spanish", body = "Hola", channel = "TextOnly" })).GetProperty("recipientCount").GetInt32());

        var emailOnly = await Preview(new { programId = Sports, body = "Hi", channel = "EmailOnly" });
        Assert.Equal(1, emailOnly.GetProperty("recipientCount").GetInt32());
        Assert.Equal(1, emailOnly.GetProperty("unreachableCount").GetInt32());
    }

    [Fact]
    public async Task A_long_message_needs_two_segments()
    {
        var preview = await Preview(new { programId = Tutoring, body = new string('a', 170), channel = "TextOnly" });

        Assert.Equal(2, preview.GetProperty("segments").GetInt32());
        Assert.Equal(6, preview.GetProperty("totalSegments").GetInt32());
    }

    [Fact]
    public async Task Sending_queues_one_delivery_per_household_that_the_job_sends_by_text_and_email()
    {
        var created = await Send(Marisol, new { programId = Tutoring, body = Reminder, channel = "TextWithEmailFallback" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        Assert.Equal("Sending", (await Message(id)).GetProperty("status").GetString());

        await RunJob();

        var message = await Message(id);
        Assert.Equal("Sent", message.GetProperty("status").GetString());
        Assert.Equal(3, message.GetProperty("deliveredCount").GetInt32());
        Assert.All(message.GetProperty("deliveries").EnumerateArray(), d => Assert.Equal("Sent", d.GetProperty("status").GetString()));
        Assert.Contains(Sms.Sent, s => s.To == "905-555-0142" && s.Text.StartsWith("Harbourview Youth Collective: Reminder", StringComparison.Ordinal));
        Assert.Equal(3, Sms.Sent.Count);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Message' AND Action = 'Created'"));
        Assert.Equal(3, Used());
    }

    [Fact]
    public async Task The_job_sends_each_delivery_once_even_when_it_runs_again()
    {
        await Send(Marisol, new { programId = Tutoring, body = Reminder, channel = "TextOnly" });

        await RunJob();
        await RunJob();

        Assert.Equal(3, Sms.Sent.Count);
    }

    [Fact]
    public async Task A_household_without_the_chosen_channel_is_shown_as_failed_with_the_reason()
    {
        var id = await SendAndGetId(new { programId = Sports, body = "Gym is closed Saturday.", channel = "EmailOnly" });

        await RunJob();

        var tran = Assert.Single((await Message(id)).GetProperty("deliveries").EnumerateArray());
        Assert.Equal("Tran", tran.GetProperty("household").GetString());
        Assert.Equal("Failed", tran.GetProperty("status").GetString());
        Assert.Equal("No email address", tran.GetProperty("reason").GetString());
        Assert.Empty(Email.Sent);
    }

    [Fact]
    public async Task A_provider_failure_is_retried_with_backoff_then_recorded_as_failed()
    {
        Sms.FailFor("905-555-0128");
        var id = await SendAndGetId(new { programId = Tutoring, body = Reminder, channel = "TextOnly" });

        for (var attempt = 0; attempt < 3; attempt++)
        {
            await RunJob();
            _factory.Clock.Advance(TimeSpan.FromMinutes(10));
        }

        var message = await Message(id);
        var haddad = message.GetProperty("deliveries").EnumerateArray().Single(d => d.GetProperty("household").GetString() == "Haddad");
        Assert.Equal("Failed", haddad.GetProperty("status").GetString());
        Assert.Equal("The text provider refused it.", haddad.GetProperty("reason").GetString());
        Assert.Equal(1, message.GetProperty("failedCount").GetInt32());
        Assert.Equal("Sent", message.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Near_the_cap_the_preview_warns_how_many_households_get_email_instead()
    {
        SetUsed(1999);

        var preview = await Preview(new { programId = Tutoring, body = Reminder, channel = "TextWithEmailFallback" });

        Assert.Equal(1, preview.GetProperty("remainingSegments").GetInt32());
        Assert.Equal(2, preview.GetProperty("fallingBackToEmail").GetInt32());
    }

    [Fact]
    public async Task At_the_cap_texts_fall_back_to_email_or_pause_and_email_continues()
    {
        SetUsed(2000);
        var tutoring = await SendAndGetId(new { programId = Tutoring, body = Reminder, channel = "TextWithEmailFallback" });
        var sports = await SendAndGetId(new { programId = Sports, body = "Gym is closed Saturday.", channel = "TextWithEmailFallback" });

        await RunJob();

        Assert.Empty(Sms.Sent);
        Assert.Equal(3, Email.Sent.Count);
        Assert.All((await Message(tutoring)).GetProperty("deliveries").EnumerateArray(), d => Assert.Equal("FellBackToEmail", d.GetProperty("status").GetString()));
        var tran = Assert.Single((await Message(sports)).GetProperty("deliveries").EnumerateArray());
        Assert.Equal("Paused", tran.GetProperty("status").GetString());
        Assert.Equal("SMS cap reached", tran.GetProperty("reason").GetString());
        var cap = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/messaging/sms-cap");
        Assert.Equal("Reached", cap.GetProperty("state").GetString());
        Assert.Equal(2000, cap.GetProperty("cap").GetInt32());
    }

    [Fact]
    public async Task A_message_needs_a_body_and_someone_to_reach()
    {
        var response = await Send(Marisol, new { programId = Tutoring, body = "", channel = "TextOnly" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Enter a message.", (await Errors(response)).GetProperty("body").GetString());

        var nobody = await Send(Marisol, new { programId = Tutoring, language = "Tagalog", body = "Hi", channel = "TextOnly" });
        Assert.Equal("Nobody matches. Loosen a filter.", (await Errors(nobody)).GetProperty("audience").GetString());
    }

    [Fact]
    public async Task Messages_lists_the_sent_message_with_its_audience_and_status()
    {
        await Send(Marisol, new { programId = Tutoring, body = Reminder, channel = "TextWithEmailFallback" });

        var list = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/messages");

        var row = Assert.Single(list.GetProperty("messages").EnumerateArray());
        Assert.Equal("Reminder: RBG trip is Sat 14 Nov.", row.GetProperty("title").GetString());
        Assert.Equal("After-School Tutoring", row.GetProperty("audience").GetString());
        Assert.Equal(3, row.GetProperty("recipientCount").GetInt32());
        Assert.Equal("Marisol Delgado", row.GetProperty("sentBy").GetString());
        Assert.Equal(0, list.GetProperty("segmentsUsed").GetInt32());
    }

    [Fact]
    public async Task Youth_workers_cannot_message_guardians()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Aisha, new { programId = Tutoring, body = "Hi", channel = "TextOnly" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).GetAsync("/messages")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_messages_and_programs_are_never_reached()
    {
        var id = await SendAndGetId(new { programId = Tutoring, body = Reminder, channel = "TextOnly" });
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/messages/{id}")).StatusCode);
        Assert.Empty((await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/messages")).GetProperty("messages").EnumerateArray());
        Assert.Equal(0, (await PreviewAs(Grace, new { programId = Tutoring, body = "Hi", channel = "TextOnly" })).GetProperty("recipientCount").GetInt32());
    }

    [Fact]
    public async Task With_Messages_off_the_endpoints_answer_404_and_the_job_sends_nothing()
    {
        await Send(Marisol, new { programId = Tutoring, body = Reminder, channel = "TextOnly" });
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });

        await RunJob();

        Assert.Empty(Sms.Sent);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/messages")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Marisol, new { programId = Tutoring, body = "Hi", channel = "TextOnly" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/messaging/sms-cap")).StatusCode);
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private Task<JsonElement> Preview(object body) => PreviewAs(Marisol, body);

    private async Task<JsonElement> PreviewAs(Guid membership, object body)
    {
        var response = await _factory.ClientFor(membership).PostAsJsonAsync("/messages/preview", body);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private Task<HttpResponseMessage> Send(Guid membership, object body) => _factory.ClientFor(membership).PostAsJsonAsync("/messages", body);

    private async Task<Guid> SendAndGetId(object body)
    {
        var response = await Send(Marisol, body);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<JsonElement> Message(Guid id) => await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/messages/{id}");

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    private int Used() => int.Parse(Query($"SELECT Used FROM SmsUsagePeriods WHERE OrganizationId = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'").Single());

    private void SetUsed(int used)
    {
        var org = DatabaseSeeder.Harbourview.ToString().ToUpperInvariant();
        Execute($"INSERT INTO SmsUsagePeriods (Id, OrganizationId, Period, Cap, Used) VALUES ('{Guid.NewGuid().ToString().ToUpperInvariant()}', '{org}', '2026-11', 2000, {used})");
    }

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
