using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;

namespace PromiseHub.Api.Tests;

// L2-044 recovering account access: reset by emailed link, L2-031 sessions, L2-032 audit.
public sealed partial class PasswordResetTests : IAsyncLifetime
{
    private const string Jaylen = "jaylen@harbourview.example";
    private const string NewPassword = "harbour-lantern-2027";

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task Asking_for_a_reset_emails_a_link_and_answers_the_same_for_an_unknown_address()
    {
        var known = await Ask(Jaylen);
        var unknown = await Ask("nobody@example.org");

        Assert.Equal(HttpStatusCode.Accepted, known.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, unknown.StatusCode);
        Assert.Single(Email.Bodies, b => b.To == Jaylen && b.Body.Contains("/reset-password?token=", StringComparison.Ordinal));
        Assert.DoesNotContain(Email.Bodies, b => b.To == "nobody@example.org");
    }

    [Fact]
    public async Task A_valid_link_names_the_account_and_sets_a_new_password_that_signs_in()
    {
        await Ask(Jaylen);
        var token = Token();
        var browser = _factory.NewBrowser();

        var link = await browser.GetFromJsonAsync<JsonElement>($"/auth/reset-password/{token}");
        var reset = await browser.PostAsJsonAsync("/auth/reset-password", new { token, password = NewPassword, repeat = NewPassword });

        Assert.Equal(Jaylen, link.GetProperty("email").GetString());
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.NewBrowser().PostAsJsonAsync("/auth/sign-in", new { email = Jaylen, password = NewPassword, remember = false })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.NewBrowser().PostAsJsonAsync("/auth/sign-in", new { email = Jaylen, password = ApiFactoryBase.StaffPassword, remember = false })).StatusCode);
        Assert.NotEmpty(Query("SELECT Id FROM AuditEntries WHERE Summary = 'Reset password by emailed link'"));
    }

    [Fact]
    public async Task Resetting_signs_out_other_devices()
    {
        var phone = _factory.NewBrowser();
        (await phone.PostAsJsonAsync("/auth/sign-in", new { email = Jaylen, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        await Ask(Jaylen);

        await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token = Token(), password = NewPassword, repeat = NewPassword });

        Assert.Equal(HttpStatusCode.Unauthorized, (await phone.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task A_short_or_mismatched_password_is_refused_per_field()
    {
        await Ask(Jaylen);

        var reset = await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token = Token(), password = "short", repeat = "other" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, reset.StatusCode);
        var errors = (await reset.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Use at least 12 characters.", errors.GetProperty("password").GetString());
        Assert.Equal("The two passwords don’t match.", errors.GetProperty("repeat").GetString());
    }

    [Fact]
    public async Task A_link_expires_after_an_hour_and_works_only_once()
    {
        await Ask(Jaylen);
        var token = Token();
        await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token, password = NewPassword, repeat = NewPassword });

        Assert.Equal(HttpStatusCode.Gone, (await _factory.NewBrowser().GetAsync($"/auth/reset-password/{token}")).StatusCode);

        await Ask(Jaylen);
        var second = Token();
        _factory.Clock.Advance(TimeSpan.FromMinutes(61));
        Assert.Equal(HttpStatusCode.Gone, (await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token = second, password = NewPassword, repeat = NewPassword })).StatusCode);
    }

    private Task<HttpResponseMessage> Ask(string email) => _factory.NewBrowser().PostAsJsonAsync("/auth/forgot-password", new { email });

    private string Token() => LinkPattern().Match(Email.Bodies.Last(b => b.To == Jaylen).Body).Groups["token"].Value;

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    [GeneratedRegex(@"reset-password\?token=(?<token>[A-Za-z0-9_-]+)")]
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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
