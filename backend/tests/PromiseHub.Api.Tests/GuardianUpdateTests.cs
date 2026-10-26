using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-011 criterion 7 and L2-026 criterion 6: a verified guardian updates contact, language and medical details; audited and tenant-bound.
public sealed partial class GuardianUpdateTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_verified_guardian_updates_email_and_language_and_staff_see_it()
    {
        var (guardian, token) = await Verified();

        var saved = await guardian.PutAsJsonAsync($"/g/home/{token}/household", new { mobile = "905-555-0142", email = "carmen.rivera@example.com", language = "English" });

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var home = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");
        Assert.Equal("en", home.GetProperty("language").GetString());
        Assert.Equal("carmen.rivera@example.com", home.GetProperty("contact").GetProperty("email").GetString());
        var household = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/households/{DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera")}");
        Assert.Equal("English", household.GetProperty("language").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Guardian' AND Summary LIKE '%by the guardian%'"));
    }

    [Fact]
    public async Task A_changed_mobile_is_saved_and_ends_every_link_and_device_so_new_links_go_to_the_new_number()
    {
        var (guardian, token) = await Verified();

        var saved = await guardian.PutAsJsonAsync($"/g/home/{token}/household", new { mobile = "905-555-0177", email = "", language = "Spanish" });

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.Equal(HttpStatusCode.Gone, (await guardian.GetAsync($"/g/home/{token}")).StatusCode);
        Assert.Single(Query("SELECT Id FROM Guardians WHERE Mobile = '905-555-0177'"));
    }

    [Fact]
    public async Task Contact_details_are_checked()
    {
        var (guardian, token) = await Verified();

        var invalid = await guardian.PutAsJsonAsync($"/g/home/{token}/household", new { mobile = "905", email = "not-an-email", language = "Klingon" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("mobile", out _));
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("language", out _));
    }

    [Fact]
    public async Task A_verified_guardian_updates_a_childs_allergies_and_medication_which_are_audited()
    {
        var (guardian, token) = await Verified();

        var saved = await guardian.PutAsJsonAsync($"/g/home/{token}/children/{Mateo}/medical", new { allergies = "Peanuts (anaphylaxis); sesame", medication = "EpiPen 0.3 mg, carried" });
        var outsider = await guardian.PutAsJsonAsync($"/g/home/{token}/children/{Jordan}/medical", new { allergies = "None", medication = "" });

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, outsider.StatusCode);
        var card = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{Mateo}/quick-card");
        Assert.Equal("Peanuts (anaphylaxis); sesame", card.GetProperty("medical").GetProperty("allergies").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Child' AND Summary LIKE '%medical%by the guardian%'"));
    }

    [Fact]
    public async Task An_unverified_device_cannot_update()
    {
        var token = await Link();
        var stranger = _factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await stranger.PutAsJsonAsync($"/g/home/{token}/household", new { mobile = "905-555-0142", email = "", language = "Spanish" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await stranger.PutAsJsonAsync($"/g/home/{token}/children/{Mateo}/medical", new { allergies = "", medication = "" })).StatusCode);
    }

    private async Task<(HttpClient Client, string Token)> Verified()
    {
        var token = await Link();
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        await client.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value });
        return (client, token);
    }

    private async Task<string> Link()
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Organizations.TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
        var url = scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Guardian.GuardianLinkIssuer>().IssueHome(DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera"));
        await scope.ServiceProvider.GetRequiredService<PromiseHub.Application.IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

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
