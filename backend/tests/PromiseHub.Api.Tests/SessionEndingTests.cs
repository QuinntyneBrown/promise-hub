using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-048, L2-049, L2-032
// Description: sign-out ends the session on the server so a copied cookie stops working; the cookie is HttpOnly, Secure and SameSite=Strict.
public sealed class SessionEndingTests : IAsyncLifetime
{
    private const string Sofia = "sofia@harbourview.example";

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task A_copy_of_the_session_cookie_stops_working_once_the_session_signs_out()
    {
        var (phone, cookie) = await SignedIn(Sofia);
        var copy = Raw(cookie);
        Assert.Equal(HttpStatusCode.OK, (await copy.GetAsync("/me")).StatusCode);

        var signOut = await phone.PostAsync("/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.NoContent, signOut.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await copy.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task Signing_out_one_device_leaves_the_persons_other_sessions_signed_in()
    {
        var (phone, _) = await SignedIn(Sofia);
        var (laptop, _) = await SignedIn(Sofia);

        await phone.PostAsync("/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.OK, (await laptop.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task Signing_out_is_audited_in_the_sessions_organization()
    {
        var (phone, _) = await SignedIn(Sofia);

        await phone.PostAsync("/auth/sign-out", null);

        Assert.Equal([DatabaseSeeder.Harbourview.ToString().ToUpperInvariant() + "|Sofía Rivera|Signed out"],
            Query("SELECT OrganizationId, ActorName, Summary FROM AuditEntries WHERE Action = 'SignedOut'"));
    }

    [Fact]
    public async Task Ended_sessions_are_kept_only_for_the_twelve_hours_their_cookie_could_live()
    {
        var (first, _) = await SignedIn(Sofia);
        await first.PostAsync("/auth/sign-out", null);
        _factory.Clock.Advance(TimeSpan.FromHours(13));
        var (second, _) = await SignedIn("daniel@harbourview.example");

        await second.PostAsync("/auth/sign-out", null);

        Assert.Single(Query("SELECT Id FROM EndedSessions"));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task The_session_cookie_is_HttpOnly_Secure_and_strict_and_persists_only_when_asked(bool remember)
    {
        var response = await _factory.NewBrowser().PostAsJsonAsync("/auth/sign-in", new { email = Sofia, password = ApiFactoryBase.StaffPassword, remember });

        var cookie = response.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith(".PromiseHub.Session=", StringComparison.Ordinal)).ToLowerInvariant();
        Assert.Contains("httponly", cookie);
        Assert.Contains("secure", cookie);
        Assert.Contains("samesite=strict", cookie);
        Assert.Equal(remember, cookie.Contains("expires=", StringComparison.Ordinal));
    }

    private async Task<(HttpClient Browser, string Cookie)> SignedIn(string email)
    {
        var browser = _factory.NewBrowser();
        var response = await browser.PostAsJsonAsync("/auth/sign-in", new { email, password = ApiFactoryBase.StaffPassword, remember = true });
        response.EnsureSuccessStatusCode();
        var cookie = response.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith(".PromiseHub.Session=", StringComparison.Ordinal));
        return (browser, cookie.Split(';')[0]);
    }

    /// <summary>A second device that replays a copied cookie.</summary>
    private HttpClient Raw(string cookie)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = false });
        client.DefaultRequestHeaders.Add("Cookie", cookie);
        return client;
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
