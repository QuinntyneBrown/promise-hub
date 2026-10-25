using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-020 criteria 1, 2 and 5 approved pickups by staff and guardians, L2-007 roles, L2-001 tenant isolation, L2-032 audit, L2-005 Pickup off.
public sealed partial class ApprovedPickupTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_site_lead_adds_an_adult_who_appears_in_sign_out_and_on_the_Quick_Card()
    {
        var added = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/children/{Mateo}/pickups", new { name = "Rosa Alvarez", relationship = "Aunt", mobile = "905-555-0199", siblings = true });

        Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        var options = await _factory.ClientFor(Aisha).GetFromJsonAsync<JsonElement>($"/children/{Mateo}/pickups");
        Assert.Contains(options.GetProperty("approved").EnumerateArray(), a => a.GetProperty("name").GetString() == "Rosa Alvarez" && a.GetProperty("pickupId").ValueKind == JsonValueKind.String);
        var card = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/children/{Sofia}/quick-card");
        Assert.Contains(card.GetProperty("approvedPickups").EnumerateArray(), p => p.GetProperty("name").GetString() == "Rosa Alvarez");
        Assert.Equal(2, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'ApprovedPickup' AND Action = 'Created'").Count);
    }

    [Fact]
    public async Task Missing_name_or_relationship_is_named_and_youth_workers_cannot_change_the_list()
    {
        var invalid = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/children/{Mateo}/pickups", new { name = " ", relationship = "", mobile = (string?)null, siblings = false });
        var youthWorker = await _factory.ClientFor(Aisha).PostAsJsonAsync($"/children/{Mateo}/pickups", new { name = "Rosa Alvarez", relationship = "Aunt", mobile = (string?)null, siblings = false });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the adult’s full name.", errors.GetProperty("name").GetString());
        Assert.Equal("Say how they know Mateo.", errors.GetProperty("relationship").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, youthWorker.StatusCode);
    }

    [Fact]
    public async Task Removing_by_staff_keeps_history_texts_the_primary_guardian_and_is_audited()
    {
        var id = await Add(Mateo, "Rosa Alvarez");

        var removed = await _factory.ClientFor(Jaylen).DeleteAsync($"/children/{Mateo}/pickups/{id}");
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        var options = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/children/{Mateo}/pickups");
        Assert.DoesNotContain(options.GetProperty("approved").EnumerateArray(), a => a.GetProperty("name").GetString() == "Rosa Alvarez");
        Assert.Single(Query("SELECT Id FROM ApprovedPickups WHERE RemovedAt IS NOT NULL"));
        Assert.Contains(Sms.Sent, s => s.To == "905-555-0142" && s.Text.Contains("Rosa Alvarez was removed from Mateo’s approved pickups", StringComparison.Ordinal));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'ApprovedPickup' AND Action = 'Deleted'"));
    }

    [Fact]
    public async Task A_verified_guardian_adds_and_removes_on_the_family_page()
    {
        var token = await HomeLink();
        var guardian = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await guardian.PostAsJsonAsync($"/g/home/{token}/children/{Mateo}/pickups", new { name = "Luis Rivera", relationship = "Uncle", mobile = (string?)null, siblings = false })).StatusCode);
        await guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        await guardian.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value });

        var added = await guardian.PostAsJsonAsync($"/g/home/{token}/children/{Mateo}/pickups", new { name = "Luis Rivera", relationship = "Uncle", mobile = (string?)null, siblings = false });
        var home = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");
        var mateo = home.GetProperty("children").EnumerateArray().Single(c => c.GetProperty("name").GetString() == "Mateo Rivera");
        var luis = mateo.GetProperty("pickups").EnumerateArray().Single(p => p.GetProperty("name").GetString() == "Luis Rivera");
        var removed = await guardian.DeleteAsync($"/g/home/{token}/children/{Mateo}/pickups/{luis.GetProperty("id").GetGuid()}");
        var outsider = await guardian.PostAsJsonAsync($"/g/home/{token}/children/{DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson")}/pickups", new { name = "X Y", relationship = "Friend", mobile = (string?)null, siblings = false });

        Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, outsider.StatusCode);
    }

    [Fact]
    public async Task Another_organization_or_Pickup_off_never_reaches_the_list()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/children/{Mateo}/pickups", new { name = "Rosa Alvarez", relationship = "Aunt", mobile = (string?)null, siblings = false })).StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/children/{Mateo}/pickups", new { name = "Rosa Alvarez", relationship = "Aunt", mobile = (string?)null, siblings = false })).StatusCode);
    }

    private async Task<Guid> Add(Guid child, string name) =>
        (await (await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/children/{child}/pickups", new { name, relationship = "Aunt", mobile = (string?)null, siblings = false })).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

    /// <summary>A home link for the Riveras, minted as an enrollment decision text would.</summary>
    private async Task<string> HomeLink()
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Organizations.TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
        var issuer = scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Guardian.GuardianLinkIssuer>();
        var url = issuer.IssueHome(DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera"));
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
