using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-040 criterion 6 notification settings, L2-034 jobs honour them, L2-007 roles, L2-001 tenant isolation, L2-032 audit.
public sealed class NotificationSettingsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private const string Alert = "Reply 1 if on the way, 2 if absent.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_organization_starts_with_the_defaults()
    {
        var settings = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/notifications");

        Assert.Equal(15, settings.GetProperty("noShowDelayMinutes").GetInt32());
        Assert.True(settings.GetProperty("emailSupervisorsOnIncidents").GetBoolean());
        Assert.Equal(2000, settings.GetProperty("smsCap").GetInt32());
        Assert.Equal(0, settings.GetProperty("smsUsed").GetInt32());
    }

    [Fact]
    public async Task Saving_out_of_range_values_names_each_field()
    {
        var response = await Save(Tom, delay: 2, emails: true, cap: -1);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Choose between 5 and 60 minutes.", errors.GetProperty("noShowDelayMinutes").GetString());
        Assert.StartsWith("Can’t be below", errors.GetProperty("smsCap").GetString());
    }

    [Fact]
    public async Task A_shorter_no_show_delay_texts_sooner()
    {
        (await Save(Tom, delay: 10, emails: true, cap: 2000)).EnsureSuccessStatusCode();

        await RunJob();

        Assert.Contains(Sms.Sent, s => s.Text.Contains(Alert, StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_longer_no_show_delay_waits()
    {
        (await Save(Tom, delay: 20, emails: true, cap: 2000)).EnsureSuccessStatusCode();

        _factory.Clock.Advance(TimeSpan.FromMinutes(4));
        await RunJob();

        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains(Alert, StringComparison.Ordinal));
    }

    [Fact]
    public async Task Turning_off_supervisor_emails_stops_the_incident_email_but_not_the_notification()
    {
        (await Save(Tom, delay: 15, emails: false, cap: 2000)).EnsureSuccessStatusCode();

        await _factory.ClientFor(Aisha).PostAsJsonAsync("/incidents", new
        {
            category = "Injury",
            childId = Mateo,
            occurredAt = "2026-11-05T18:40:00Z",
            place = "Stairwell",
            whatHappened = "Mateo slipped on the stairs.",
            actionTaken = "Ice pack.",
            guardianContact = "CalledAndReached",
            severity = "Minor",
        });

        Assert.DoesNotContain(Email.Sent, e => e.Subject.Contains("New incident", StringComparison.Ordinal));
        Assert.Equal(1, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("unread").GetInt32());
    }

    [Fact]
    public async Task A_lower_sms_cap_is_saved_and_shown()
    {
        (await Save(Tom, delay: 15, emails: true, cap: 500)).EnsureSuccessStatusCode();

        var settings = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/notifications");

        Assert.Equal(500, settings.GetProperty("smsCap").GetInt32());
    }

    [Fact]
    public async Task Only_settings_managers_read_or_save_and_each_organization_keeps_its_own()
    {
        (await Save(Tom, delay: 30, emails: true, cap: 2000)).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/notifications")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Aisha, delay: 5, emails: true, cap: 2000)).StatusCode);
        Assert.Equal(15, (await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/notifications")).GetProperty("noShowDelayMinutes").GetInt32());
    }

    private Task<HttpResponseMessage> Save(Guid membership, int delay, bool emails, int cap) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/notifications", new { noShowDelayMinutes = delay, emailSupervisorsOnIncidents = emails, smsCap = cap });

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
