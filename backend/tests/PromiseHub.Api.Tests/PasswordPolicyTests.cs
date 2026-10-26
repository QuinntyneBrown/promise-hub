using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Staff;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-053 password policy: one rule on every path that sets a password, and only a hash is stored.
public sealed partial class PasswordPolicyTests : IAsyncLifetime
{
    private const string Jaylen = "jaylen@harbourview.example";

    private readonly SignInApiFactory _factory = new();

    public static TheoryData<string, string> Refused => new()
    {
        { "short", "Use at least 12 characters." },
        { new string('a', 129), "Use at most 128 characters." },
    };

    [Theory]
    [MemberData(nameof(Refused))]
    public async Task Accepting_and_resetting_refuse_the_same_password_with_the_same_message(string password, string message)
    {
        var token = await Invite("sam.ortiz@harbourview.example");

        var accepted = await _factory.NewBrowser().PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Sam Ortiz", password });
        var reset = await Reset(password);

        Assert.Equal(message, await PasswordError(accepted));
        Assert.Equal(message, await PasswordError(reset));
    }

    [Fact]
    public async Task A_password_containing_the_email_name_is_refused_on_both_paths_ignoring_case()
    {
        var token = await Invite("sam.ortiz@harbourview.example");

        var accepted = await _factory.NewBrowser().PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Sam Ortiz", password = "my name is SAM.ORTIZ 2026" });
        var reset = await Reset("i am jaylen and I run tutoring");

        Assert.Equal("Don’t use your email in your password.", await PasswordError(accepted));
        Assert.Equal("Don’t use your email in your password.", await PasswordError(reset));
    }

    [Fact]
    public async Task A_policy_compliant_password_is_stored_only_as_a_hash()
    {
        var token = await Invite("sam.ortiz@harbourview.example");

        var accepted = await _factory.NewBrowser().PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Sam Ortiz", password = "harbour lantern 2027" });

        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        var hash = Assert.Single(Query("SELECT PasswordHash FROM StaffUsers WHERE Email = 'sam.ortiz@harbourview.example'"));
        Assert.DoesNotContain("harbour lantern", hash, StringComparison.Ordinal);
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE Summary LIKE '%harbour lantern%'"));
    }

    private async Task<HttpResponseMessage> Reset(string password)
    {
        await _factory.NewBrowser().PostAsJsonAsync("/auth/forgot-password", new { email = Jaylen });
        var token = LinkPattern().Match(Email.Bodies.Last(b => b.To == Jaylen).Body).Groups["token"].Value;
        return await _factory.NewBrowser().PostAsJsonAsync("/auth/reset-password", new { token, password, repeat = password });
    }

    private static async Task<string?> PasswordError(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("password").GetString();
    }

    private async Task<string> Invite(string email)
    {
        var token = GuardianTokens.New();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IPromiseHubDb>();
        scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Organizations.TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
        db.StaffInvitations.Add(new StaffInvitation(Guid.NewGuid(), DatabaseSeeder.Harbourview, email, Role.YouthWorker, GuardianTokens.Hash(token), "Tom Nguyen", _factory.Clock.GetUtcNow()));
        await db.SaveChangesAsync();
        return token;
    }

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
