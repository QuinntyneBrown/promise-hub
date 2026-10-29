using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-134 criteria 3, 4 and 6, L2-032, L2-031, L2-001
// Description: a visitor starts a monthly donation of $20, $50 or $100 through the organization's public address; PromiseHub asks the
// payment provider for a hosted checkout, stores the pledge with the provider's reference only, audits it and answers the checkout address;
// without a provider it answers 503 unavailable and stores nothing.
public sealed class WebsiteDonationsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();

    private FakePaymentProvider Provider => _factory.Services.GetRequiredService<FakePaymentProvider>();

    private static object Gift(int monthlyAmount = 50, string name = "Dana Thompson", string email = "Dana.T@example.com") => new { monthlyAmount, name, email };

    [Fact]
    public async Task A_monthly_gift_starts_a_checkout_stores_the_pledge_with_the_reference_only_and_answers_the_checkout_address()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var started = await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/donations", Gift());

        Assert.Equal(HttpStatusCode.OK, started.StatusCode);
        Assert.Equal("https://checkout.example/pay/chk_001", (await started.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("checkoutUrl").GetString());
        Assert.Equal((DatabaseSeeder.Harbourview, 50, "dana.t@example.com"), Assert.Single(Provider.Started));
        Assert.Equal("50|Dana Thompson|dana.t@example.com|chk_001", Assert.Single(Query("SELECT MonthlyAmount || '|' || Name || '|' || Email || '|' || ProviderReference FROM DonationPledges")));
        Assert.Equal("Website visitor|Created|Monthly pledge of $50 started", Assert.Single(Query(
            "SELECT ActorName || '|' || Action || '|' || Summary FROM AuditEntries WHERE RecordType = 'DonationPledge'")));
    }

    [Fact]
    public async Task Any_other_amount_or_a_missing_name_answers_422_and_no_checkout_starts()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var invalid = await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/donations", Gift(monthlyAmount: 35, name: "", email: "dana"));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Choose a monthly amount.", errors.GetProperty("monthlyAmount").GetString());
        Assert.Equal("Enter your name.", errors.GetProperty("name").GetString());
        Assert.Equal("Enter an email like name@example.com.", errors.GetProperty("email").GetString());
        Assert.Empty(Provider.Started);
        Assert.Empty(Query("SELECT Id FROM DonationPledges"));
    }

    [Fact]
    public async Task Without_a_payment_provider_it_answers_503_unavailable_and_stores_nothing()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        Provider.Configured = false;

        var unavailable = await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/donations", Gift());

        Assert.Equal(HttpStatusCode.ServiceUnavailable, unavailable.StatusCode);
        Assert.Equal("unavailable", (await unavailable.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Empty(Query("SELECT Id FROM DonationPledges"));
    }

    [Fact]
    public async Task A_sixth_pledge_from_one_email_within_an_hour_answers_429()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        var visitor = _factory.CreateClient();
        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await visitor.PostAsJsonAsync("/website/harbourview/donations", Gift())).StatusCode);
        }

        Assert.Equal((HttpStatusCode)429, (await visitor.PostAsJsonAsync("/website/harbourview/donations", Gift())).StatusCode);
        Assert.Equal(5, Provider.Started.Count);
    }

    [Fact]
    public async Task With_the_module_off_or_another_organization_s_address_unpublished_it_answers_404()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/donations", Gift())).StatusCode);
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.CreateClient().PostAsJsonAsync("/website/northgate/donations", Gift())).StatusCode);
        Assert.Empty(Provider.Started);
    }

    private async Task Modules(Guid admin, string[] on) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(admin).PutAsJsonAsync("/settings/modules", new { on })).StatusCode);

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
