using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-118 criteria 2 to 5, L2-053, L2-031, L2-032
// Description: anyone signed in changes their password by proving the current one; other sessions end in every organization, this one
// carries on, and the change is audited in the active organization only without the password.
public sealed class ChangePasswordTests : IAsyncLifetime
{
    private const string Jaylen = "jaylen@harbourview.example";
    private const string NewPassword = "lanterns over the harbour";

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task The_right_current_password_changes_it_ends_other_sessions_and_keeps_this_one()
    {
        var phone = await SignIn(Jaylen);
        var laptop = await SignIn(Jaylen);

        var changed = await Change(laptop, ApiFactoryBase.StaffPassword, NewPassword, NewPassword);

        Assert.Equal(HttpStatusCode.NoContent, changed.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await laptop.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await phone.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SignInWith(Jaylen, NewPassword)).StatusCode);
        Assert.NotEqual(HttpStatusCode.OK, (await SignInWith(Jaylen, ApiFactoryBase.StaffPassword)).StatusCode);
        var summary = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Summary LIKE '%changed their password%'"));
        Assert.DoesNotContain(NewPassword, summary);
        Assert.DoesNotContain(NewPassword, string.Join(';', Query("SELECT PasswordHash FROM StaffUsers")));
    }

    [Fact]
    public async Task A_wrong_current_password_is_refused_on_its_field_and_nothing_changes()
    {
        var browser = await SignIn(Jaylen);

        var refused = await Change(browser, "not my password at all", NewPassword, NewPassword);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal("That isn’t your current password.", (await Errors(refused)).GetProperty("current").GetString());
        Assert.Equal(HttpStatusCode.OK, (await SignInWith(Jaylen, ApiFactoryBase.StaffPassword)).StatusCode);
    }

    [Fact]
    public async Task The_policy_and_the_repeat_apply_to_the_new_password()
    {
        var browser = await SignIn(Jaylen);

        var weak = await Errors(await Change(browser, ApiFactoryBase.StaffPassword, "jaylen at the harbour", "jaylen at the harbour"));
        var shortOne = await Errors(await Change(browser, ApiFactoryBase.StaffPassword, "short", "short"));
        var differs = await Errors(await Change(browser, ApiFactoryBase.StaffPassword, NewPassword, "lanterns over the bay"));

        Assert.Equal("Don’t use your email in your password.", weak.GetProperty("password").GetString());
        Assert.Equal("Use at least 12 characters.", shortOne.GetProperty("password").GetString());
        Assert.Equal("The two passwords don’t match.", differs.GetProperty("repeat").GetString());
        Assert.Empty(Query("SELECT Summary FROM AuditEntries WHERE Summary LIKE '%changed their password%'"));
    }

    [Fact]
    public async Task A_youth_changes_her_own_password_the_same_way()
    {
        var browser = await SignIn("sofia@harbourview.example");

        Assert.Equal(HttpStatusCode.NoContent, (await Change(browser, ApiFactoryBase.StaffPassword, NewPassword, NewPassword)).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await SignInWith("sofia@harbourview.example", NewPassword)).StatusCode);
    }

    [Fact]
    public async Task A_person_at_two_organizations_is_audited_in_the_active_one_only()
    {
        var browser = await SignIn("priya@harbourview.example");
        var active = (await browser.GetFromJsonAsync<JsonElement>("/me")).GetProperty("organizationId").GetGuid();

        await Change(browser, ApiFactoryBase.StaffPassword, NewPassword, NewPassword);

        var organizations = Query("SELECT OrganizationId FROM AuditEntries WHERE Summary LIKE '%changed their password%'");
        Assert.Equal([active], organizations.Select(Guid.Parse));
        Assert.Contains(active, new[] { DatabaseSeeder.Harbourview, DatabaseSeeder.Northgate });
    }

    [Fact]
    public async Task Without_a_session_it_answers_401()
    {
        var anonymous = await Change(_factory.NewBrowser(), ApiFactoryBase.StaffPassword, NewPassword, NewPassword);

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    private static Task<HttpResponseMessage> Change(HttpClient browser, string current, string password, string repeat) =>
        browser.PostAsJsonAsync("/me/password", new { current, password, repeat });

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    private async Task<HttpClient> SignIn(string email)
    {
        var browser = _factory.NewBrowser();
        (await browser.PostAsJsonAsync("/auth/sign-in", new { email, password = ApiFactoryBase.StaffPassword, remember = true })).EnsureSuccessStatusCode();
        return browser;
    }

    private Task<HttpResponseMessage> SignInWith(string email, string password) =>
        _factory.NewBrowser().PostAsJsonAsync("/auth/sign-in", new { email, password, remember = true });

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
