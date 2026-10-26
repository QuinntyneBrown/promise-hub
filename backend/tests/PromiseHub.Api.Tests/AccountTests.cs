using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace PromiseHub.Api.Tests;

// L2-006 staff sign-in (account, recovery codes, sign out everywhere), L2-031 session security, L2-032 audit.
public sealed class AccountTests : IAsyncLifetime
{
    private const string Jaylen = "jaylen@harbourview.example";

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task The_account_page_shows_the_person_their_role_and_organization()
    {
        var browser = await SignIn(Jaylen);

        var account = await browser.GetFromJsonAsync<JsonElement>("/me/account");

        Assert.Equal("Jaylen Okafor", account.GetProperty("name").GetString());
        Assert.Equal(Jaylen, account.GetProperty("email").GetString());
        Assert.Equal("SiteLead", account.GetProperty("role").GetString());
        Assert.Equal("Harbourview Youth Collective", account.GetProperty("organization").GetString());
        Assert.Equal(0, account.GetProperty("recoveryCodesLeft").GetInt32());
    }

    [Fact]
    public async Task New_recovery_codes_are_shown_once_and_replace_the_old_ones()
    {
        var browser = await SignIn(Jaylen);

        var first = await (await browser.PostAsync("/me/recovery-codes", null)).Content.ReadFromJsonAsync<JsonElement>();
        var second = await (await browser.PostAsync("/me/recovery-codes", null)).Content.ReadFromJsonAsync<JsonElement>();

        var codes = first.GetProperty("codes").EnumerateArray().Select(c => c.GetString()!).ToList();
        Assert.Equal(10, codes.Count);
        Assert.All(codes, c => Assert.Matches("^[a-z0-9]{4}-[a-z0-9]{4}$", c));
        Assert.NotEqual(codes, second.GetProperty("codes").EnumerateArray().Select(c => c.GetString()!).ToList());
        Assert.Equal(10, (await browser.GetFromJsonAsync<JsonElement>("/me/account")).GetProperty("recoveryCodesLeft").GetInt32());
        Assert.DoesNotContain(Query("SELECT RecoveryCodes FROM StaffUsers WHERE Email = 'jaylen@harbourview.example'").Single(), codes[0]);
    }

    [Fact]
    public async Task Signing_out_everywhere_ends_other_sessions_and_keeps_this_one()
    {
        var phone = await SignIn(Jaylen);
        var laptop = await SignIn(Jaylen);

        var done = await laptop.PostAsync("/me/sign-out-others", null);

        Assert.Equal(HttpStatusCode.NoContent, done.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await laptop.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await phone.GetAsync("/me")).StatusCode);
        Assert.NotEmpty(Query("SELECT Id FROM AuditEntries WHERE Summary = 'Signed out other devices'"));
    }

    [Fact]
    public async Task Signing_in_again_after_signing_out_everywhere_works()
    {
        var laptop = await SignIn(Jaylen);
        await laptop.PostAsync("/me/sign-out-others", null);

        var phone = await SignIn(Jaylen);

        Assert.Equal(HttpStatusCode.OK, (await phone.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task Without_a_session_the_account_answers_401()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.NewBrowser().GetAsync("/me/account")).StatusCode);
    }

    private async Task<HttpClient> SignIn(string email)
    {
        var browser = _factory.NewBrowser();
        (await browser.PostAsJsonAsync("/auth/sign-in", new { email, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        return browser;
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

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
