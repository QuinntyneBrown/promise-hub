using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-113 criterion 4, L2-050, L2-002
// Description: a deactivated account is told it is inactive only after the right password; someone deactivated in one organization
// signs in to their other one only, and their open session there continues.
public sealed class DeactivatedSignInTests : IAsyncLifetime
{
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task A_deactivated_volunteer_is_told_the_account_is_inactive_only_after_the_right_password()
    {
        var phone = _factory.NewBrowser();
        (await SignIn(phone, "leo@harbourview.example", ApiFactoryBase.StaffPassword)).EnsureSuccessStatusCode();

        await Deactivate(Leo);

        var next = await phone.GetAsync("/me");
        Assert.Equal(HttpStatusCode.Unauthorized, next.StatusCode);
        Assert.Equal("account-deactivated", (await next.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        var right = await SignIn(_factory.NewBrowser(), "leo@harbourview.example", ApiFactoryBase.StaffPassword);
        Assert.Equal(HttpStatusCode.Forbidden, right.StatusCode);
        Assert.Equal("account-deactivated", (await right.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await SignIn(_factory.NewBrowser(), "leo@harbourview.example", "not-it")).StatusCode);
    }

    [Fact]
    public async Task Someone_deactivated_in_one_organization_continues_in_their_other_one()
    {
        var laptop = _factory.NewBrowser();
        (await SignIn(laptop, "priya@harbourview.example", ApiFactoryBase.StaffPassword)).EnsureSuccessStatusCode();
        Assert.Equal("Harbourview Youth Collective", (await laptop.GetFromJsonAsync<JsonElement>("/me")).GetProperty("organizationName").GetString());

        await Deactivate(PriyaAtHarbourview);

        Assert.Equal("Northgate Community Church Kids", (await laptop.GetFromJsonAsync<JsonElement>("/me")).GetProperty("organizationName").GetString());
        var organizations = await laptop.GetFromJsonAsync<JsonElement>("/me/organizations");
        Assert.DoesNotContain(organizations.GetProperty("organizations").EnumerateArray(), o => o.GetProperty("name").GetString() == "Harbourview Youth Collective");
    }

    /// <summary>Tom, the admin, deactivates the membership from the person record, after his second factor.</summary>
    private async Task Deactivate(Guid membershipId)
    {
        var tom = _factory.NewBrowser();
        await SignIn(tom, "tom@harbourview.example", ApiFactoryBase.StaffPassword);
        var code = Totp.Code(ApiFactoryBase.MfaSecret, _factory.Clock.GetUtcNow());
        (await tom.PostAsJsonAsync("/auth/mfa", new { code, trustDevice = false })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NoContent, (await tom.PostAsync($"/people/{membershipId}/deactivate", null)).StatusCode);
    }

    private static Task<HttpResponseMessage> SignIn(HttpClient browser, string email, string password) =>
        browser.PostAsJsonAsync("/auth/sign-in", new { email, password, remember = true });

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
