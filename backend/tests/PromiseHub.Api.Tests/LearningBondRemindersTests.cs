using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-157: reminders on the dates that matter, sent once at 10:00 where the organization is, never when turned off or while the module is
// off. L2-158: the running total of dollars unlocked, by child and stream, updated and texted when a program reports a benefit started.
public sealed class LearningBondRemindersTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    // L2-157 criterion 1.
    [Fact]
    public async Task A_finished_benefits_check_sets_the_reminders_on_the_households_dates()
    {
        Assert.Empty((await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/reminders"))).GetProperty("reminders").EnumerateArray());
        await BenefitsCheck();

        var reminders = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/reminders"));

        Assert.Equal(["Taxes 2026|2027-03-15", "Renewal Canada Child Benefit|2027-07-01", "TurnsEighteen Sofía|2032-05-03", "TurnsEighteen Mateo|2035-02-12"],
            reminders.GetProperty("reminders").EnumerateArray().Select(r => $"{r.GetProperty("kind").GetString()} {r.GetProperty("subject").GetString()}|{r.GetProperty("dueOn").GetString()}"));
    }

    // L2-157 criteria 2 and 3: at 10:00 on its day, once; turned off, never.
    [Fact]
    public async Task A_reminder_is_texted_once_at_10_on_its_day_and_one_turned_off_never()
    {
        await BenefitsCheck();
        var reminders = (await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/reminders"))).GetProperty("reminders").EnumerateArray().ToList();
        var renewal = reminders.Single(r => r.GetProperty("kind").GetString() == "Renewal").GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.NoContent, (await _carmen.Http.PutAsync(_carmen.Path($"/reminders/{renewal}/off"), null)).StatusCode);

        await At(new DateTimeOffset(2027, 3, 15, 13, 30, 0, TimeSpan.Zero));
        Assert.Equal(0, TaxTexts());
        await At(new DateTimeOffset(2027, 3, 15, 14, 30, 0, TimeSpan.Zero));
        Assert.Equal(2, TaxTexts());
        await At(new DateTimeOffset(2027, 3, 15, 18, 0, 0, TimeSpan.Zero));
        Assert.Equal(2, TaxTexts());
        Assert.StartsWith("Harbourview Youth Collective: recordatorio: presente sus impuestos de 2026", Sms.Sent.First(s => s.Text.Contains("impuestos de 2026", StringComparison.Ordinal)).Text,
            StringComparison.Ordinal);
        // Months on, the device is verified again before the page reads the reminders.
        var again = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        Assert.Contains((await again.Http.GetFromJsonAsync<JsonElement>(again.Path("/reminders"))).GetProperty("reminders").EnumerateArray(),
            r => r.GetProperty("kind").GetString() == "Taxes" && r.GetProperty("subject").GetString() == "2027");

        await At(new DateTimeOffset(2027, 7, 1, 15, 0, 0, TimeSpan.Zero));
        Assert.DoesNotContain(Sms.Sent, s => s.Text.Contains("Canada Child Benefit", StringComparison.Ordinal) || s.Text.Contains("Beneficio por Hijos de Canadá", StringComparison.Ordinal));
    }

    // L2-157 criterion 4: off on the day means never; a date still ahead resumes.
    [Fact]
    public async Task With_the_module_off_on_its_day_a_reminder_is_never_sent_later()
    {
        await BenefitsCheck();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages" } });

        await At(new DateTimeOffset(2027, 3, 15, 15, 0, 0, TimeSpan.Zero));
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages", "LearningBond" } });
        await At(new DateTimeOffset(2027, 3, 16, 15, 0, 0, TimeSpan.Zero));

        Assert.Equal(0, TaxTexts());
    }

    // L2-158 criteria 1 to 3.
    [Fact]
    public async Task The_total_shows_what_is_applied_for_then_what_is_unlocked_and_a_started_benefit_is_texted()
    {
        var total = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/total"));
        Assert.Equal(0, total.GetProperty("confirmed").GetInt32());
        Assert.Equal(1400, total.GetProperty("estimated").GetInt32());
        Assert.True(total.GetProperty("nothingConfirmed").GetBoolean());
        await BenefitsCheck();
        var review = await (await _carmen.Http.PostAsync(_carmen.Path("/benefits/ontario-child-benefit/applications"), null)).Content.ReadFromJsonAsync<JsonElement>();
        await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/benefits/applications/{review.GetProperty("id").GetString()}/submit"),
            new { reviewVersion = review.GetProperty("reviewVersion").GetInt32() });

        await Webhook("providers/northfield", ApiFactoryBase.NorthfieldWebhookSecret, new { eventId = "dep-1", reference = "NCU-0001", kind = "Deposited", amount = 1400 });
        var started = await Webhook("programs/ontario-child-benefit", "ocb-test-secret", new { eventId = "ocb-1", reference = "BEN-0001", kind = "Started", amount = 1680 });
        await Webhook("programs/ontario-child-benefit", "ocb-test-secret", new { eventId = "ocb-1", reference = "BEN-0001", kind = "Started", amount = 1680 });

        Assert.Equal(HttpStatusCode.OK, started.StatusCode);
        total = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/total"));
        Assert.Equal(3080, total.GetProperty("confirmed").GetInt32());
        Assert.Equal(0, total.GetProperty("estimated").GetInt32());
        Assert.False(total.GetProperty("nothingConfirmed").GetBoolean());
        Assert.Equal(["Mateo|Learning Bond|1400", "Mateo|Ontario Child Benefit|840", "Sofía|Ontario Child Benefit|840"],
            total.GetProperty("lines").EnumerateArray().Where(l => l.GetProperty("confirmed").GetBoolean())
                .Select(l => $"{l.GetProperty("child").GetString()}|{l.GetProperty("stream").GetString()}|{l.GetProperty("amount").GetInt32()}"));
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        Assert.Equal(2, Sms.Sent.Count(s => s.Text == "Ontario Child Benefit comenzó para su familia. Ya desbloqueó $3,080 hasta ahora."));
    }

    // L2-158 criterion 4, L2-150 criterion 3: another household's total is its own; an unsigned program event changes nothing.
    [Fact]
    public async Task Another_households_total_is_its_own_and_an_unsigned_program_event_is_refused()
    {
        var linh = await new LearningBondGuardianClient(_factory).OpenAsync("Tran", "905-555-0163");

        var theirs = await linh.Http.GetFromJsonAsync<JsonElement>(linh.Path("/total"));

        Assert.Equal(0, theirs.GetProperty("estimated").GetInt32());
        Assert.Empty(theirs.GetProperty("lines").EnumerateArray());
        Assert.Equal(HttpStatusCode.Unauthorized, (await Webhook("programs/ontario-child-benefit", "wrong", new { eventId = "x", reference = "BEN-0001", kind = "Started", amount = 1 })).StatusCode);
    }

    private int TaxTexts() => Sms.Sent.Count(s => s.Text.Contains("impuestos de 2026", StringComparison.Ordinal));

    private async Task At(DateTimeOffset when)
    {
        _factory.Clock.Advance(when - _factory.Clock.GetUtcNow());
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
    }

    private async Task BenefitsCheck()
    {
        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { scope = "Benefits", typedName = "Carmen Rivera" });
        Assert.Equal(HttpStatusCode.NoContent, (await _carmen.Http.PutAsJsonAsync(_carmen.Path("/benefits/intake"),
            new { householdSize = 3, maritalStatus = "Single", ccbNow = "Yes", incomeChanged = "No" })).StatusCode);
    }

    private async Task<HttpResponseMessage> Webhook(string path, string secret, object payload)
    {
        var body = JsonSerializer.Serialize(payload);
        var signature = Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body)));
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        content.Headers.Add("X-PromiseHub-Signature", $"sha256={signature}");
        return await _factory.CreateClient().PostAsync($"/learning-bond/webhooks/{path}", content);
    }

    public async Task InitializeAsync()
    {
        _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
