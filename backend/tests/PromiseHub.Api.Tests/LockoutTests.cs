using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-047, L2-044, L2-032, L2-001
// Description: consecutive failures lock an email for 15 minutes; the lock and a reset that ends it are audited per organization.
public sealed partial class LockoutTests : IAsyncLifetime
{
    private const string Sofia = "sofia@harbourview.example";
    private const string NewPassword = "harbour-lantern-2027";

    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task A_sixth_attempt_after_five_failures_is_locked_even_with_the_right_password()
    {
        await Fail(Sofia, 5);

        var sixth = await SignIn(Sofia, ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.Locked, sixth.StatusCode);
        var body = await sixth.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("locked", body.GetProperty("code").GetString());
        Assert.Equal(_factory.Clock.GetUtcNow().AddMinutes(15), body.GetProperty("lockedUntil").GetDateTimeOffset());
    }

    [Fact]
    public async Task Failures_before_a_successful_sign_in_never_count_towards_a_lock()
    {
        await Fail(Sofia, 4);
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        Assert.Equal(HttpStatusCode.OK, (await SignIn(Sofia, ApiFactoryBase.StaffPassword)).StatusCode);
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Fail(Sofia, 4);

        var next = await SignIn(Sofia, ApiFactoryBase.StaffPassword);

        Assert.Equal(HttpStatusCode.OK, next.StatusCode);
    }

    [Fact]
    public async Task The_fifth_failure_is_audited_in_every_organization_of_the_email_and_no_other()
    {
        await Fail("priya@harbourview.example", 5);
        await Fail(Sofia, 5);
        await Fail("ghost@harbourview.example", 5);

        var priya = Query("SELECT OrganizationId FROM AuditEntries WHERE Action = 'SignInLocked' AND ActorName = 'Priya Raman' ORDER BY OrganizationId");
        var harbourview = DatabaseSeeder.Harbourview.ToString().ToUpperInvariant();
        var northgate = DatabaseSeeder.Northgate.ToString().ToUpperInvariant();
        Assert.Equal([.. new[] { harbourview, northgate }.Order(StringComparer.Ordinal)], priya);
        Assert.Equal([harbourview], Query("SELECT OrganizationId FROM AuditEntries WHERE Action = 'SignInLocked' AND ActorName = 'Sofía Rivera'"));
        Assert.Equal(["Sign-in locked after 5 failed attempts"], Query("SELECT Summary FROM AuditEntries WHERE Action = 'SignInLocked' AND ActorName = 'Sofía Rivera'"));
        Assert.Equal(3, Query("SELECT Id FROM AuditEntries WHERE Action = 'SignInLocked'").Count);
    }

    [Fact]
    public async Task A_password_reset_ends_the_lock_and_is_audited_as_an_unlock()
    {
        await Fail(Sofia, 5);
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await _factory.NewBrowser().PostAsJsonAsync("/auth/forgot-password", new { email = Sofia });

        var reset = await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token = Token(Sofia), password = NewPassword, repeat = NewPassword });
        var next = await SignIn(Sofia, NewPassword);

        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);
        Assert.Equal(HttpStatusCode.OK, next.StatusCode);
        Assert.Equal([DatabaseSeeder.Harbourview.ToString().ToUpperInvariant() + "|Unlocked sign-in by password reset"],
            Query("SELECT OrganizationId, Summary FROM AuditEntries WHERE Action = 'SignInUnlocked'"));
    }

    [Fact]
    public async Task A_reset_without_a_lock_writes_no_unlock()
    {
        await _factory.NewBrowser().PostAsJsonAsync("/auth/forgot-password", new { email = Sofia });

        await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token = Token(Sofia), password = NewPassword, repeat = NewPassword });

        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE Action = 'SignInUnlocked'"));
    }

    private async Task Fail(string email, int times)
    {
        for (var i = 0; i < times; i++)
        {
            Assert.Equal(HttpStatusCode.Unauthorized, (await SignIn(email, "wrong")).StatusCode);
        }
    }

    private Task<HttpResponseMessage> SignIn(string email, string password) =>
        _factory.NewBrowser().PostAsJsonAsync("/auth/sign-in", new { email, password, remember = false });

    private string Token(string to) =>
        LinkPattern().Match(_factory.Services.GetRequiredService<FakeEmailSender>().Bodies.Last(b => b.To == to).Body).Groups["token"].Value;

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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
