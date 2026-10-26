using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-050, L2-007, L2-002, L2-001
// Description: a person whose every membership is removed is told the account is inactive, only after the right password;
// removal from one organization leaves the others; a timed-out youth session answers session-expired.
public sealed class DeactivatedAccountTests : IAsyncLifetime
{
    private const string Nadia = "nadia@harbourview.example";
    private static readonly Guid NadiaMembership = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, Nadia);
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task A_removed_youth_who_signs_in_with_the_right_password_is_told_the_account_is_inactive_and_gets_no_session()
    {
        await Remove(NadiaMembership);
        var browser = _factory.NewBrowser();

        var answer = await SignIn(browser, Nadia, ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.Forbidden, answer.StatusCode);
        Assert.Equal("account-deactivated", (await answer.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/me")).StatusCode);
    }

    [Fact]
    public async Task A_removed_youth_with_a_wrong_password_gets_the_generic_answer()
    {
        await Remove(NadiaMembership);

        var wrong = await SignIn(_factory.NewBrowser(), Nadia, "not-it");
        var unknown = await SignIn(_factory.NewBrowser(), "nobody@harbourview.example", "not-it");

        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        Assert.Equal(await unknown.Content.ReadAsStringAsync(), await wrong.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_signed_in_youth_whose_last_membership_is_removed_gets_account_deactivated_on_her_next_request()
    {
        var phone = _factory.NewBrowser();
        (await SignIn(phone, Nadia, ApiFactoryBase.StaffPassword)).EnsureSuccessStatusCode();

        await Remove(NadiaMembership);
        var next = await phone.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, next.StatusCode);
        Assert.Equal("account-deactivated", (await next.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Another_person_can_sign_in_on_the_device_that_still_holds_an_inactive_accounts_cookie()
    {
        var sharedPhone = _factory.NewBrowser();
        (await SignIn(sharedPhone, Nadia, ApiFactoryBase.StaffPassword)).EnsureSuccessStatusCode();
        await Remove(NadiaMembership);

        var sofia = await SignIn(sharedPhone, "sofia@harbourview.example", ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.OK, sofia.StatusCode);
        Assert.Equal("Sofía Rivera", (await sharedPhone.GetFromJsonAsync<JsonElement>("/me")).GetProperty("personName").GetString());
    }

    [Fact]
    public async Task Someone_removed_from_one_organization_signs_in_to_their_other_one_only()
    {
        await Remove(PriyaAtHarbourview);
        var browser = _factory.NewBrowser();

        var answer = await SignIn(browser, "priya@harbourview.example", ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.OK, answer.StatusCode);
        var session = await browser.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal("Northgate Community Church Kids", session.GetProperty("organizationName").GetString());
        var organizations = await browser.GetFromJsonAsync<JsonElement>("/me/organizations");
        Assert.DoesNotContain(organizations.GetProperty("organizations").EnumerateArray(), o => o.GetProperty("name").GetString() == "Harbourview Youth Collective");
    }

    [Fact]
    public async Task A_youth_session_idle_for_more_than_twelve_hours_answers_session_expired()
    {
        var phone = _factory.NewBrowser();
        (await SignIn(phone, "sofia@harbourview.example", ApiFactoryBase.StaffPassword)).EnsureSuccessStatusCode();

        _factory.Clock.Advance(TimeSpan.FromHours(13));
        var answer = await phone.GetAsync("/learning/me");

        Assert.Equal(HttpStatusCode.Unauthorized, answer.StatusCode);
        Assert.Equal("session-expired", (await answer.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    /// <summary>Tom, the admin, removes the membership through the staff page's endpoint, after his second factor.</summary>
    private async Task Remove(Guid membershipId)
    {
        var tom = _factory.NewBrowser();
        await SignIn(tom, "tom@harbourview.example", ApiFactoryBase.StaffPassword);
        var code = Totp.Code(ApiFactoryBase.MfaSecret, _factory.Clock.GetUtcNow());
        (await tom.PostAsJsonAsync("/auth/mfa", new { code, trustDevice = false })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NoContent, (await tom.DeleteAsync($"/staff/{membershipId}")).StatusCode);
    }

    private static Task<HttpResponseMessage> SignIn(HttpClient browser, string email, string password) =>
        browser.PostAsJsonAsync("/auth/sign-in", new { email, password, remember = true });

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
