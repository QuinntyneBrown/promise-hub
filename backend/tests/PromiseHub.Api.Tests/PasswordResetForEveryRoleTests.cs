using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-115, L2-116, L2-053, L2-046, L2-031, L2-032, L2-001
// Description: youth, mentors and volunteers reset their own password: no enumeration, a per-account throttle, only the newest
// link works, the same policy, every other session ends, audited in one organization only, and nothing secret is logged.
public sealed partial class PasswordResetForEveryRoleTests : IAsyncLifetime
{
    private const string Sofia = "sofia@harbourview.example";
    private const string Daniel = "daniel@harbourview.example";
    private const string Lucia = "lucia@northgate.example";
    private const string Samuel = "samuel@northgate.example";
    private const string Priya = "priya@harbourview.example";
    private const string NewPassword = "harbour-lantern-2027";

    private readonly SignInApiFactory _factory = new();
    private readonly CapturingLoggerProvider _logs = new();
    private WebApplicationFactory<Program> _host = null!;

    [Fact]
    public async Task A_youth_and_a_mentor_get_a_link_and_an_unknown_or_deactivated_address_gets_the_same_answer_and_no_email()
    {
        Execute($"UPDATE Memberships SET DeactivatedAt = '2026-11-01 10:00:00+00:00' WHERE Email = '{Lucia}'");

        var answers = new[] { await Ask(Sofia), await Ask(Daniel), await Ask("nobody@example.org"), await Ask(Lucia) };

        Assert.All(answers, a => Assert.Equal(HttpStatusCode.Accepted, a.StatusCode));
        Assert.Single(Email.Bodies, b => b.To == Sofia);
        Assert.Single(Email.Bodies, b => b.To == Daniel);
        Assert.DoesNotContain(Email.Bodies, b => b.To is "nobody@example.org" or Lucia);
    }

    [Fact]
    public async Task A_fourth_request_within_the_hour_answers_the_same_and_sends_nothing_until_the_hour_has_passed()
    {
        for (var i = 0; i < 3; i++)
        {
            await Ask(Sofia);
            _factory.Clock.Advance(TimeSpan.FromMinutes(5));
        }

        var fourth = await Ask(Sofia);

        Assert.Equal(HttpStatusCode.Accepted, fourth.StatusCode);
        Assert.Equal(3, Email.Bodies.Count(b => b.To == Sofia));
        Assert.Equal("3", Query("SELECT COUNT(*) FROM PasswordResets").Single());

        _factory.Clock.Advance(TimeSpan.FromMinutes(46));
        await Ask(Sofia);
        Assert.Equal(4, Email.Bodies.Count(b => b.To == Sofia));
    }

    [Fact]
    public async Task Only_the_newest_link_works()
    {
        await Ask(Sofia);
        var first = Token(Sofia);
        await Ask(Sofia);
        var second = Token(Sofia);

        Assert.Equal(HttpStatusCode.Gone, (await Browser().GetAsync($"/auth/reset-password/{first}")).StatusCode);
        Assert.Equal(HttpStatusCode.Gone, (await Reset(Browser(), first, NewPassword)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Browser().GetAsync($"/auth/reset-password/{second}")).StatusCode);
    }

    [Fact]
    public async Task A_link_stops_working_when_the_account_is_deactivated_after_it_was_sent()
    {
        await Ask(Sofia);
        Execute($"UPDATE Memberships SET DeactivatedAt = '2026-11-05 21:30:00+00:00' WHERE Email = '{Sofia}'");

        Assert.Equal(HttpStatusCode.Gone, (await Browser().GetAsync($"/auth/reset-password/{Token(Sofia)}")).StatusCode);
    }

    [Fact]
    public async Task A_youth_resets_with_the_shared_policy_and_her_other_sessions_end()
    {
        var phone = Browser();
        (await phone.PostAsJsonAsync("/auth/sign-in", new { email = Sofia, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        await Ask(Sofia);
        var token = Token(Sofia);
        var laptop = Browser();

        var weak = await Reset(laptop, token, "sofia-loves-coding");
        var reset = await Reset(laptop, token, NewPassword);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, weak.StatusCode);
        Assert.Equal("Don’t use your email in your password.", (await weak.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("password").GetString());
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);
        var session = await laptop.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Youth", session.GetProperty("role").GetString());
        Assert.Equal(HttpStatusCode.OK, (await laptop.GetAsync("/learning/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await phone.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task A_youth_whose_organization_has_learning_off_resets_and_still_gets_404_from_learning()
    {
        await Ask(Lucia);

        var browser = Browser();
        (await Reset(browser, Token(Lucia), NewPassword)).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await browser.GetAsync("/learning/me")).StatusCode);
    }

    [Fact]
    public async Task A_mentor_whose_organization_has_mentoring_off_resets_and_still_gets_404_from_mentoring()
    {
        await Ask(Samuel);

        var browser = Browser();
        (await Reset(browser, Token(Samuel), NewPassword)).EnsureSuccessStatusCode();

        var session = await browser.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Mentor", session.GetProperty("role").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await browser.GetAsync("/mentoring/youth")).StatusCode);
    }

    [Fact]
    public async Task A_person_in_two_organizations_is_signed_out_of_both_and_the_reset_is_audited_in_one_only()
    {
        var harbourview = Browser();
        var northgate = Browser();
        (await harbourview.PostAsJsonAsync("/auth/sign-in", new { email = Priya, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        (await northgate.PostAsJsonAsync("/auth/sign-in", new { email = Priya, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        (await northgate.PostAsJsonAsync("/me/organization", new { membershipId = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, Priya) })).EnsureSuccessStatusCode();
        await Ask(Priya);

        (await Reset(Browser(), Token(Priya), NewPassword)).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.Unauthorized, (await harbourview.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await northgate.GetAsync("/me")).StatusCode);
        Assert.Equal([DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()],
            Query("SELECT upper(OrganizationId) FROM AuditEntries WHERE Summary = 'Reset password by emailed link'"));
    }

    [Fact]
    public async Task Neither_the_token_nor_the_password_is_logged_or_audited()
    {
        await Ask(Daniel);
        var token = Token(Daniel);
        var browser = Browser();

        await browser.GetAsync($"/auth/reset-password/{token}");
        (await Reset(browser, token, NewPassword)).EnsureSuccessStatusCode();

        Assert.Contains(_logs.Lines, l => Equals(l.Values.GetValueOrDefault("Route"), "/auth/reset-password/{token}"));
        Assert.DoesNotContain(_logs.Lines, l => l.Message.Contains(token, StringComparison.Ordinal) || l.Message.Contains(NewPassword, StringComparison.Ordinal));
        Assert.DoesNotContain(Query("SELECT Summary FROM AuditEntries"), s => s.Contains(token, StringComparison.Ordinal) || s.Contains(NewPassword, StringComparison.Ordinal));
        Assert.DoesNotContain(Query("SELECT TokenHash FROM PasswordResets"), h => h == token);
    }

    private Task<HttpResponseMessage> Ask(string email) => Browser().PostAsJsonAsync("/auth/forgot-password", new { email });

    private static Task<HttpResponseMessage> Reset(HttpClient browser, string token, string password) =>
        browser.PostAsJsonAsync("/auth/reset-password", new { token, password, repeat = password });

    private HttpClient Browser() =>
        _host.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });

    private string Token(string to) => LinkPattern().Match(Email.Bodies.Last(b => b.To == to).Body).Groups["token"].Value;

    private FakeEmailSender Email => _host.Services.GetRequiredService<FakeEmailSender>();

    [GeneratedRegex(@"reset-password\?token=(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex LinkPattern();

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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync()
    {
        _host = _factory.WithWebHostBuilder(b => b.ConfigureLogging(l => l.AddProvider(_logs)));
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        await _host.DisposeAsync();
        await _factory.DisposeAsync();
    }
}
