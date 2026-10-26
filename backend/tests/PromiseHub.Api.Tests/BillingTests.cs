using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-037 plans and metering, L2-022 SMS cap, L2-007 roles, L2-001 tenant isolation, L2-032 audit.
public sealed class BillingTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid NorthgateRivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Northgate, "Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_sees_the_plan_its_limits_and_usage()
    {
        var billing = await Get(Tom);

        Assert.Equal("Standard", billing.GetProperty("plan").GetString());
        Assert.Equal(89, billing.GetProperty("monthlyPrice").GetInt32());
        Assert.Equal(500, billing.GetProperty("childLimit").GetInt32());
        Assert.Equal(6, billing.GetProperty("activeChildren").GetInt32());
        Assert.Equal(2000, billing.GetProperty("smsCap").GetInt32());
        Assert.Equal("Active", billing.GetProperty("status").GetString());
    }

    [Fact]
    public async Task The_free_plan_refuses_the_51st_active_child()
    {
        var program = await Created(await _factory.ClientFor(Grace).PostAsJsonAsync("/programs", new { name = "Big Club", startsOn = "2026-09-01", endsOn = "2027-06-30", schedule = "Wed", capacity = 100, ages = "5–12", enrollmentOpen = false, seasonConsent = false }));
        for (var i = 0; i < 50; i++)
        {
            var child = await Created(await _factory.ClientFor(Grace).PostAsJsonAsync($"/households/{NorthgateRivera}/children", new { name = $"Child {i:00} Rivera", dateOfBirth = "2018-01-01", school = "", allergies = "" }));
            var enrolled = await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{program}/enrollments", new { childId = child });
            if (i < 49)
            {
                enrolled.EnsureSuccessStatusCode();
            }
            else
            {
                Assert.Equal(HttpStatusCode.UnprocessableEntity, enrolled.StatusCode);
                Assert.StartsWith("Your Free plan covers 50 active children.", (await enrolled.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("childId").GetString());
            }
        }
        Assert.Equal(50, (await Get(Grace)).GetProperty("activeChildren").GetInt32());
    }

    [Fact]
    public async Task Changing_plan_prorates_the_difference_and_is_audited()
    {
        var changed = await _factory.ClientFor(Tom).PutAsJsonAsync("/billing/plan", new { plan = "Plus" });
        var body = await changed.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal(52.00m, body.GetProperty("proratedCharge").GetDecimal());
        Assert.Equal("Plus", (await Get(Tom)).GetProperty("plan").GetString());
        Assert.Contains("Plus", string.Join("|", Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Billing'")));
    }

    [Fact]
    public async Task The_current_plan_or_an_unknown_plan_is_refused()
    {
        var same = await _factory.ClientFor(Tom).PutAsJsonAsync("/billing/plan", new { plan = "Standard" });
        var unknown = await _factory.ClientFor(Tom).PutAsJsonAsync("/billing/plan", new { plan = "Gold" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, same.StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, unknown.StatusCode);
    }

    [Fact]
    public async Task A_failed_payment_gives_fourteen_days_of_grace_then_suspension()
    {
        Execute($"UPDATE Organizations SET PaymentFailedAt = {new DateTimeOffset(2026, 11, 1, 12, 0, 0, TimeSpan.Zero).UtcTicks} WHERE Id = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'");

        var grace = await Get(Tom);
        _factory.Clock.Advance(TimeSpan.FromDays(14));
        var suspended = await Get(Tom);

        Assert.Equal("PaymentFailed", grace.GetProperty("status").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-11-15T12:00:00Z"), grace.GetProperty("graceUntil").GetDateTimeOffset());
        Assert.Equal("Suspended", suspended.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Only_admins_manage_billing_and_each_organization_sees_its_own()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync("/billing")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).PutAsJsonAsync("/billing/plan", new { plan = "Plus" })).StatusCode);
        Assert.Equal("Free", (await Get(Grace)).GetProperty("plan").GetString());
    }

    private async Task<JsonElement> Get(Guid membership) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/billing");

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

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
            rows.Add(reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
