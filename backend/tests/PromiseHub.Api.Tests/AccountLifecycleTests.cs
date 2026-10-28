using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-113 criteria 4 to 6, L2-114, L2-050, L2-032, L2-001
// Description: an admin deactivates and reactivates an account; a deactivated membership's next request is refused, its records
// stay, every change is audited; a youth account is deactivated with its child record and stays off; only the organization's
// admins may do any of it.
public sealed class AccountLifecycleTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Haddad = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_deactivated_account_is_refused_on_its_next_request_is_listed_as_deactivated_and_audited_once()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Leo).GetAsync("/me")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await Post(Tom, $"/people/{Leo}/deactivate")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Post(Tom, $"/people/{Leo}/deactivate")).StatusCode);

        var next = await _factory.ClientFor(Leo).GetAsync("/me");
        Assert.Equal(HttpStatusCode.Unauthorized, next.StatusCode);
        Assert.Equal("account-deactivated", (await next.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        var record = await Get(Tom, $"/people/{Leo}");
        Assert.Equal("Deactivated", record.GetProperty("status").GetString());
        Assert.Equal("Tom Nguyen", record.GetProperty("deactivatedBy").GetString());
        Assert.NotEqual(JsonValueKind.Null, record.GetProperty("deactivatedAt").ValueKind);
        Assert.Equal(["Leo Martins"], Names(await Get(Tom, "/people?status=Deactivated")));
        Assert.DoesNotContain("Leo Martins", Names(await Get(Tom, "/people?status=Active")));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Deactivated' AND RecordType = 'Membership'"));
        Assert.Single(Query("SELECT Id FROM Memberships WHERE DeactivatedAt IS NOT NULL"));
    }

    [Fact]
    public async Task A_reactivated_account_signs_in_again_with_its_role_and_it_is_audited()
    {
        await Post(Tom, $"/people/{Leo}/deactivate");

        Assert.Equal(HttpStatusCode.NoContent, (await Post(Tom, $"/people/{Leo}/reactivate")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Leo).GetAsync("/me")).StatusCode);
        var record = await Get(Tom, $"/people/{Leo}");
        Assert.Equal("Active", record.GetProperty("status").GetString());
        Assert.Equal("Volunteer", record.GetProperty("role").GetString());
        Assert.Equal("Reactivated", record.GetProperty("history").EnumerateArray().First().GetProperty("action").GetString());
    }

    [Fact]
    public async Task An_admin_cannot_deactivate_their_own_account()
    {
        var self = await Post(Tom, $"/people/{Tom}/deactivate");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, self.StatusCode);
        Assert.Equal("You can’t deactivate your own account. Ask another admin.",
            (await self.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("member").GetString());
    }

    [Fact]
    public async Task A_youth_account_is_deactivated_with_its_deleted_child_record_and_stays_off()
    {
        var deleted = await _factory.ClientFor(Tom).SendAsync(new HttpRequestMessage(HttpMethod.Delete, $"/households/{Haddad}")
        {
            Content = JsonContent.Create(new { reason = "Guardian asked", confirmName = "Haddad" }),
        });
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var nadia = await Get(Tom, $"/people/{Nadia}");
        Assert.Equal("Deactivated", nadia.GetProperty("status").GetString());
        Assert.True(nadia.GetProperty("child").GetProperty("deleted").GetBoolean());
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.ClientFor(Nadia).GetAsync("/me")).StatusCode);
        var reactivate = await Post(Tom, $"/people/{Nadia}/reactivate");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, reactivate.StatusCode);
        Assert.Equal("Nadia’s child record was deleted, so the account stays off.",
            (await reactivate.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("member").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Deactivated' AND RecordType = 'Membership'"));
    }

    [Fact]
    public async Task Only_the_organizations_admins_deactivate_or_reactivate_and_never_a_removed_account()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(Marisol, $"/people/{Leo}/deactivate")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Post(Leo, $"/people/{Leo}/reactivate")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().PostAsync($"/people/{Leo}/deactivate", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, $"/people/{Leo}/deactivate")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Grace, $"/people/{Leo}/reactivate")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).DeleteAsync($"/staff/{Aisha}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Tom, $"/people/{Aisha}/deactivate")).StatusCode);
        Assert.Empty(Query("SELECT Id FROM Memberships WHERE DeactivatedAt IS NOT NULL"));
    }

    private Task<HttpResponseMessage> Post(Guid who, string path) => _factory.ClientFor(who).PostAsync(path, null);

    private async Task<JsonElement> Get(Guid who, string path) => await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>(path);

    private static string[] Names(JsonElement page) => [.. page.GetProperty("items").EnumerateArray().Select(r => r.GetProperty("name").GetString()!)];

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
