using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-006 staff sign-in, L2-031 criterion 4 (401 without a session), L2-032 (sign-in is audited).
public sealed class SignInTests(SignInApiFactory factory) : IClassFixture<SignInApiFactory>
{
    private const string Jaylen = "jaylen@harbourview.example";
    private const string Tom = "tom@harbourview.example";

    [Fact]
    public async Task Valid_credentials_start_a_session_for_the_staff_member()
    {
        var browser = factory.NewBrowser();

        var response = await SignIn(browser, Jaylen, ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("signed-in", await Status(response));
        var session = await browser.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Jaylen Okafor", session.GetProperty("personName").GetString());
        Assert.Equal("Harbourview Youth Collective", session.GetProperty("organizationName").GetString());
    }

    [Fact]
    public async Task Successful_sign_in_is_audited_in_the_staff_members_organization()
    {
        await SignIn(factory.NewBrowser(), "aisha@harbourview.example", ApiFactoryBase.StaffPassword);

        var rows = Query("SELECT OrganizationId, ActorName FROM AuditEntries WHERE Action = 'SignedIn' AND ActorName = 'Aisha Bello'");
        Assert.Equal([$"{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}|Aisha Bello"], rows);
    }

    [Fact]
    public async Task Wrong_password_and_unknown_email_get_the_same_answer()
    {
        var wrongPassword = await SignIn(factory.NewBrowser(), "marisol@harbourview.example", "not-it");
        var unknownEmail = await SignIn(factory.NewBrowser(), "nobody@harbourview.example", "not-it");

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownEmail.StatusCode);
        Assert.Equal(await wrongPassword.Content.ReadAsStringAsync(), await unknownEmail.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("priya@harbourview.example")]
    [InlineData("ghost@harbourview.example")]
    public async Task Five_failures_in_fifteen_minutes_lock_sign_in_whether_or_not_the_email_exists(string email)
    {
        for (var i = 0; i < 5; i++)
        {
            await SignIn(factory.NewBrowser(), email, "wrong");
        }

        var sixth = await SignIn(factory.NewBrowser(), email, ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.Locked, sixth.StatusCode);
        var problem = await sixth.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("locked", problem.GetProperty("code").GetString());
        Assert.True(problem.TryGetProperty("lockedUntil", out _));
    }

    [Fact]
    public async Task Lockout_ends_after_fifteen_minutes()
    {
        const string email = "sam.lockout@harbourview.example";
        for (var i = 0; i < 5; i++)
        {
            await SignIn(factory.NewBrowser(), email, "wrong");
        }

        factory.Clock.Advance(TimeSpan.FromMinutes(16));

        var answer = await SignIn(factory.NewBrowser(), email, "wrong");
        Assert.Equal(HttpStatusCode.Unauthorized, answer.StatusCode);
    }

    [Fact]
    public async Task An_admin_must_enter_a_six_digit_code_before_the_session_starts()
    {
        var browser = factory.NewBrowser();

        var first = await SignIn(browser, Tom, ApiFactoryBase.StaffPassword);

        Assert.Equal("mfa-required", await Status(first));
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/me")).StatusCode);

        var code = Totp.Code(ApiFactoryBase.MfaSecret, factory.Clock.GetUtcNow());
        var second = await browser.PostAsJsonAsync("/auth/mfa", new { code, trustDevice = false });

        Assert.Equal("signed-in", await Status(second));
        var session = await browser.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Tom Nguyen", session.GetProperty("personName").GetString());
    }

    [Fact]
    public async Task A_wrong_code_does_not_start_a_session()
    {
        var browser = factory.NewBrowser();
        await SignIn(browser, Tom, ApiFactoryBase.StaffPassword);

        var answer = await browser.PostAsJsonAsync("/auth/mfa", new { code = "000000", trustDevice = false });

        Assert.Equal(HttpStatusCode.Unauthorized, answer.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task A_code_without_a_password_step_is_refused()
    {
        var code = Totp.Code(ApiFactoryBase.MfaSecret, factory.Clock.GetUtcNow());

        var answer = await factory.NewBrowser().PostAsJsonAsync("/auth/mfa", new { code, trustDevice = false });

        Assert.Equal(HttpStatusCode.Unauthorized, answer.StatusCode);
    }

    [Fact]
    public async Task Signing_out_ends_the_session()
    {
        var browser = factory.NewBrowser();
        await SignIn(browser, Jaylen, ApiFactoryBase.StaffPassword);

        var answer = await browser.PostAsync("/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.NoContent, answer.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task A_session_idle_for_more_than_twelve_hours_answers_session_expired()
    {
        await using var isolated = new SignInApiFactory();
        var browser = isolated.NewBrowser();
        await SignIn(browser, Jaylen, ApiFactoryBase.StaffPassword);

        isolated.Clock.Advance(TimeSpan.FromHours(13));
        var answer = await browser.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, answer.StatusCode);
        var problem = await answer.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("session-expired", problem.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Without_a_session_protected_endpoints_answer_401()
    {
        var answer = await factory.NewBrowser().GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, answer.StatusCode);
    }

    private static Task<HttpResponseMessage> SignIn(HttpClient browser, string email, string password) =>
        browser.PostAsJsonAsync("/auth/sign-in", new { email, password, remember = true });

    private static async Task<string?> Status(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString();

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(factory.ConnectionString);
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
}
