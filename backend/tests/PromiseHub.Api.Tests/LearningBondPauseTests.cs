using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-151: a claim that cannot go on pauses with plain help and the right link, offers reminders at 14 and 30 days, resumes from the same link
// at the step it paused on with every answer kept, and closes as Not completed after 180 idle days with its SINs destroyed.
public sealed class LearningBondPauseTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    // L2-151 criterion 1.
    [Fact]
    public async Task No_SIN_yet_pauses_the_claim_with_how_to_get_one_and_staff_see_it()
    {
        var pause = await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/children/{Mateo}/pause"), new { reason = "NeedsSin" });

        Assert.Equal(HttpStatusCode.NoContent, pause.StatusCode);
        var paused = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/paused"));
        Assert.Equal("NeedsSin", paused.GetProperty("reason").GetString());
        Assert.Equal("intake", paused.GetProperty("resumeStep").GetString());
        Assert.Equal("https://www.canada.ca/en/employment-social-development/services/sin/apply.html", paused.GetProperty("helpLink").GetString());
        Assert.Equal(JsonValueKind.Null, paused.GetProperty("reminder").ValueKind);
        Assert.Equal("PausedNeedsSin", await Status());
        // Reopening the link shows where Mateo's claim stopped, so the page can pick it up there (L2-151 criterion 4).
        var page = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/page"));
        var mateo = page.GetProperty("children").EnumerateArray().Single(c => c.GetProperty("firstName").GetString() == "Mateo");
        Assert.Equal("Paused", mateo.GetProperty("claim").GetString());
        var sofia = page.GetProperty("children").EnumerateArray().Single(c => c.GetProperty("firstName").GetString() == "Sofía");
        Assert.Equal(JsonValueKind.Null, sofia.GetProperty("claim").ValueKind);
    }

    // L2-151 criterion 2: no tax return pauses at the estimate with the free tax clinic finder.
    [Fact]
    public async Task No_tax_return_pauses_at_the_estimate_with_the_tax_clinic_finder()
    {
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled = "No" });
        await _carmen.Http.GetAsync(_carmen.Path($"/children/{Mateo}/estimate"));

        var paused = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/paused"));

        Assert.Equal("NeedsTaxReturn", paused.GetProperty("reason").GetString());
        Assert.Equal("estimate", paused.GetProperty("resumeStep").GetString());
        Assert.Contains("community-volunteer-income-tax-program", paused.GetProperty("helpLink").GetString(), StringComparison.Ordinal);
    }

    // L2-151 criterion 3: one text after 14 days and one after 30, then none.
    [Fact]
    public async Task A_chosen_reminder_texts_once_at_14_days_and_once_at_30_then_never()
    {
        await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/children/{Mateo}/pause"), new { reason = "NeedsSin" });

        var remind = await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/reminder"), new { remind = true });

        Assert.Equal(HttpStatusCode.OK, remind.StatusCode);
        Assert.Equal(["2026-11-19", "2026-12-05"], (await remind.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("reminderDates").EnumerateArray().Select(d => d.GetString()!));
        Assert.Equal(0, await Reminders());
        _factory.Clock.Advance(TimeSpan.FromDays(14));
        Assert.Equal(1, await Reminders());
        Assert.Equal(1, await Reminders());
        _factory.Clock.Advance(TimeSpan.FromDays(16));
        Assert.Equal(2, await Reminders());
        _factory.Clock.Advance(TimeSpan.FromDays(60));
        Assert.Equal(2, await Reminders());
        var text = Sms.Sent.First(s => s.Text.Contains("Mateo", StringComparison.Ordinal) && s.Text.Contains("/paused", StringComparison.Ordinal)).Text;
        Assert.StartsWith("Harbourview Youth Collective: la solicitud del Bono de Estudios de Mateo le espera.", text, StringComparison.Ordinal);
    }

    // L2-151 criterion 3, L2-144 criterion 4: I'm not interested ends the reminders.
    [Fact]
    public async Task Not_interested_after_choosing_a_reminder_sends_nothing()
    {
        await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/children/{Mateo}/pause"), new { reason = "NeedsSin" });
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/reminder"), new { remind = true });
        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/choice"), new { choice = "NotInterested" });

        _factory.Clock.Advance(TimeSpan.FromDays(31));

        Assert.Equal(0, await Reminders());
    }

    // L2-151 criterion 4: giving the SIN later resumes the claim with every answer kept, and the reminders stop.
    [Fact]
    public async Task Giving_the_SIN_later_resumes_the_claim_and_cancels_the_reminders()
    {
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", taxFiled = "Yes" });
        await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/children/{Mateo}/pause"), new { reason = "NeedsSin" });
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/reminder"), new { remind = true });

        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/intake"), new { childSin = "345 123 459" });

        var intake = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/intake"));
        Assert.Equal("212", intake.GetProperty("guardianSin").GetString());
        Assert.Equal("Yes", intake.GetProperty("taxFiled").GetString());
        Assert.Equal(HttpStatusCode.OK, (await _carmen.Http.GetAsync(_carmen.Path($"/children/{Mateo}/estimate"))).StatusCode);
        Assert.Equal("Started", await Status());
        _factory.Clock.Advance(TimeSpan.FromDays(31));
        Assert.Equal(0, await Reminders());
    }

    // L2-151 criterion 5.
    [Fact]
    public async Task A_paused_claim_idle_for_180_days_closes_as_Not_completed_and_its_SINs_are_destroyed()
    {
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled = "No" });
        await _carmen.Http.GetAsync(_carmen.Path($"/children/{Mateo}/estimate"));

        _factory.Clock.Advance(TimeSpan.FromDays(181));
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

        Assert.Equal("NotCompleted|", Scalar("SELECT Status || '|' || COALESCE(ChildSinCiphertext, '') FROM LearningBondClaims"));
        Assert.Equal("", Scalar("SELECT COALESCE(GuardianSinCiphertext, '') FROM LearningBondIntakes"));
        Assert.Equal("NotCompleted", await Status());
        // Months later the device must be verified again; then the claim starts from the beginning.
        var again = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        var consent = await again.Http.GetFromJsonAsync<JsonElement>(again.Path("/consent"));
        Assert.Contains(consent.GetProperty("children").EnumerateArray(), c => c.GetProperty("firstName").GetString() == "Mateo");
    }

    private async Task<int> Reminders()
    {
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        return Sms.Sent.Count(s => s.To == "905-555-0142" && s.Text.Contains("/paused", StringComparison.Ordinal));
    }

    private async Task<string> Status() =>
        (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == "Rivera").GetProperty("status").GetString()!;

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public async Task InitializeAsync()
    {
        _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
