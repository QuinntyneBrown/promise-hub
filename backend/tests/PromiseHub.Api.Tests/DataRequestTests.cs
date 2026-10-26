using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-030 criterion 4 guardian data requests, L2-026 verified links, L2-007 roles, L2-001 tenant isolation, L2-032 audit.
public sealed partial class DataRequestTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_verified_guardian_asks_for_a_copy_and_admins_are_told()
    {
        var (guardian, token) = await Verified();

        var asked = await guardian.PostAsJsonAsync($"/g/home/{token}/data-requests", new { kind = "Export", email = "carmen.rivera@example.com" });
        var list = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/data-requests");

        Assert.Equal(HttpStatusCode.Created, asked.StatusCode);
        var request = Assert.Single(list.GetProperty("requests").EnumerateArray());
        Assert.Equal("Rivera", request.GetProperty("household").GetString());
        Assert.Equal("Export", request.GetProperty("kind").GetString());
        Assert.Equal("Open", request.GetProperty("status").GetString());
        Assert.Equal(1, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("unread").GetInt32());
    }

    [Fact]
    public async Task A_request_needs_an_email_and_a_kind()
    {
        var (guardian, token) = await Verified();

        var missing = await guardian.PostAsJsonAsync($"/g/home/{token}/data-requests", new { kind = "Export", email = "" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, missing.StatusCode);
        Assert.Equal("Enter an email.", (await missing.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("email").GetString());
    }

    [Fact]
    public async Task Fulfilling_an_export_contains_only_the_household_is_emailed_and_audited()
    {
        var id = await Ask("Export");

        var fulfilled = await _factory.ClientFor(Tom).PostAsync($"/settings/data-requests/{id}/fulfil", null);
        var file = await _factory.ClientFor(Tom).GetStringAsync($"/settings/data-requests/{id}/export");

        Assert.Equal(HttpStatusCode.NoContent, fulfilled.StatusCode);
        Assert.Contains("Mateo Rivera", file);
        Assert.Contains("Carmen Rivera", file);
        Assert.DoesNotContain("Thompson", file);
        Assert.Contains(Email.Sent, e => e.To == "carmen.rivera@example.com");
        Assert.NotEmpty(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'DataRequest'"));
    }

    [Fact]
    public async Task Fulfilling_a_deletion_soft_deletes_the_household_for_thirty_days()
    {
        var id = await Ask("Delete");

        await _factory.ClientFor(Tom).PostAsync($"/settings/data-requests/{id}/fulfil", null);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/households/{Rivera}")).StatusCode);
        Assert.Single(Query($"SELECT Id FROM Households WHERE Id = '{Rivera.ToString().ToUpperInvariant()}' AND PurgeAfter IS NOT NULL"));
        Assert.Equal("Fulfilled", (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/data-requests")).GetProperty("requests")[0].GetProperty("status").GetString());
    }

    [Fact]
    public async Task Fulfilling_twice_answers_409()
    {
        var id = await Ask("Export");
        await _factory.ClientFor(Tom).PostAsync($"/settings/data-requests/{id}/fulfil", null);

        Assert.Equal(HttpStatusCode.Conflict, (await _factory.ClientFor(Tom).PostAsync($"/settings/data-requests/{id}/fulfil", null)).StatusCode);
    }

    [Fact]
    public async Task Only_settings_managers_see_requests_and_another_organization_cannot_fulfil_them()
    {
        var id = await Ask("Export");

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/data-requests")).StatusCode);
        Assert.Empty((await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/data-requests")).GetProperty("requests").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsync($"/settings/data-requests/{id}/fulfil", null)).StatusCode);
    }

    [Fact]
    public async Task A_survey_link_does_not_open_the_household_page()
    {
        string survey;
        using (var scope = _factory.Services.CreateScope())
        {
            scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Organizations.TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
            var url = scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Guardian.GuardianLinkIssuer>().IssueSurvey(Rivera, Guid.NewGuid(), Mateo);
            await scope.ServiceProvider.GetRequiredService<PromiseHub.Application.IPromiseHubDb>().SaveChangesAsync();
            survey = url[(url.LastIndexOf('/') + 1)..];
        }
        var (guardian, _) = await Verified();

        Assert.Equal(HttpStatusCode.Gone, (await guardian.GetAsync($"/g/home/{survey}")).StatusCode);
    }

    private async Task<Guid> Ask(string kind)
    {
        var (guardian, token) = await Verified();
        var asked = await guardian.PostAsJsonAsync($"/g/home/{token}/data-requests", new { kind, email = "carmen.rivera@example.com" });
        return (await asked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<(HttpClient Client, string Token)> Verified()
    {
        string token;
        using (var scope = _factory.Services.CreateScope())
        {
            scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Organizations.TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
            var url = scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Guardian.GuardianLinkIssuer>().IssueHome(Rivera);
            await scope.ServiceProvider.GetRequiredService<PromiseHub.Application.IPromiseHubDb>().SaveChangesAsync();
            token = url[(url.LastIndexOf('/') + 1)..];
        }
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        await client.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value });
        return (client, token);
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

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
