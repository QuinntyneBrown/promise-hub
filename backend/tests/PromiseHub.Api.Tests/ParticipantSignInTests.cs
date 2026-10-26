using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-046, L2-005, L2-001, L2-032
// Description: youth and mentors sign in through the staff sign-in; the session carries only their own organization's role and modules.
public sealed class ParticipantSignInTests(SignInApiFactory factory) : IClassFixture<SignInApiFactory>
{
    [Fact]
    public async Task A_youth_signs_in_without_a_second_factor_and_her_session_names_her_role_and_organizations_modules()
    {
        var browser = factory.NewBrowser();

        var response = await SignIn(browser, "sofia@harbourview.example", ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("signed-in", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        var session = await browser.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Youth", session.GetProperty("role").GetString());
        Assert.Equal("Harbourview Youth Collective", session.GetProperty("organizationName").GetString());
        Assert.Contains("Learning", Modules(session));
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/learning/me")).StatusCode);
    }

    [Fact]
    public async Task A_mentor_signs_in_and_reaches_mentoring()
    {
        var browser = factory.NewBrowser();

        await SignIn(browser, "daniel@harbourview.example", ApiFactoryBase.StaffPassword);

        var session = await browser.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Mentor", session.GetProperty("role").GetString());
        Assert.Contains("Mentoring", Modules(session));
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/mentoring/youth")).StatusCode);
    }

    [Fact]
    public async Task Youth_and_mentors_at_an_organization_with_the_modules_off_get_404_and_no_other_organizations_modules()
    {
        var lucia = factory.NewBrowser();
        var samuel = factory.NewBrowser();

        await SignIn(lucia, "lucia@northgate.example", ApiFactoryBase.StaffPassword);
        await SignIn(samuel, "samuel@northgate.example", ApiFactoryBase.StaffPassword);

        var session = await lucia.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Northgate Community Church Kids", session.GetProperty("organizationName").GetString());
        Assert.DoesNotContain("Learning", Modules(session));
        Assert.Equal(HttpStatusCode.NotFound, (await lucia.GetAsync("/learning/me")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await samuel.GetAsync("/mentoring/youth")).StatusCode);
    }

    [Fact]
    public async Task A_youths_sign_in_is_audited_in_her_own_organization_only()
    {
        await SignIn(factory.NewBrowser(), "nadia@harbourview.example", ApiFactoryBase.StaffPassword);

        var rows = Query("SELECT OrganizationId FROM AuditEntries WHERE Action = 'SignedIn' AND ActorName = 'Nadia Haddad'");
        Assert.Equal([DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()], rows);
    }

    [Fact]
    public async Task A_youth_with_a_wrong_password_gets_the_same_answer_as_an_unknown_email()
    {
        var wrong = await SignIn(factory.NewBrowser(), "daniel@harbourview.example", "not-it");
        var unknown = await SignIn(factory.NewBrowser(), "nobody-youth@harbourview.example", "not-it");

        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        Assert.Equal(await wrong.Content.ReadAsStringAsync(), await unknown.Content.ReadAsStringAsync());
    }

    private static List<string?> Modules(JsonElement session) =>
        [.. session.GetProperty("modules").EnumerateArray().Select(m => m.GetString())];

    private static Task<HttpResponseMessage> SignIn(HttpClient browser, string email, string password) =>
        browser.PostAsJsonAsync("/auth/sign-in", new { email, password, remember = true });

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
