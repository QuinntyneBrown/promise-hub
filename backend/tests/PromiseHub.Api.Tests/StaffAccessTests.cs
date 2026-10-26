using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-007 roles, L2-009 criterion 6 invitations, L2-032 audit, L2-001 tenant isolation: an admin invites staff, changes roles and removes access.
public sealed class StaffAccessTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_invites_by_email_with_a_role_and_the_invitation_is_listed_and_emailed()
    {
        var invited = await _factory.ClientFor(Tom).PostAsJsonAsync("/staff/invitations", new { email = "sam@harbourview.example", role = "YouthWorker" });

        Assert.Equal(HttpStatusCode.Created, invited.StatusCode);
        Assert.Contains(Email.Sent, e => e.To == "sam@harbourview.example" && e.Subject.Contains("Harbourview Youth Collective", StringComparison.Ordinal));
        var staff = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/staff");
        var sam = staff.GetProperty("invitations").EnumerateArray().Single();
        Assert.Equal("sam@harbourview.example", sam.GetProperty("email").GetString());
        Assert.Equal("YouthWorker", sam.GetProperty("role").GetString());
        Assert.Contains(staff.GetProperty("members").EnumerateArray(), m => m.GetProperty("name").GetString() == "Jaylen Okafor" && m.GetProperty("role").GetString() == "SiteLead");
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'StaffInvitation' AND Action = 'Created'"));
    }

    [Fact]
    public async Task An_invalid_or_duplicate_invitation_is_named()
    {
        var invalid = await _factory.ClientFor(Tom).PostAsJsonAsync("/staff/invitations", new { email = "sam", role = "Mayor" });
        var member = await _factory.ClientFor(Tom).PostAsJsonAsync("/staff/invitations", new { email = "jaylen@harbourview.example", role = "YouthWorker" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("role", out _));
        Assert.Equal("Jaylen Okafor already has access.", (await member.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("email").GetString());
    }

    [Fact]
    public async Task A_changed_role_applies_on_the_next_request_and_admins_cannot_demote_themselves()
    {
        Assert.False((await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>("/incidents")).GetProperty("canReadLog").GetBoolean());

        var changed = await _factory.ClientFor(Tom).PutAsJsonAsync($"/staff/{Jaylen}/role", new { role = "ProgramDirector" });
        var self = await _factory.ClientFor(Tom).PutAsJsonAsync($"/staff/{Tom}/role", new { role = "SiteLead" });

        Assert.Equal(HttpStatusCode.NoContent, changed.StatusCode);
        Assert.True((await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>("/incidents")).GetProperty("canReadLog").GetBoolean());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, self.StatusCode);
        Assert.Equal("You can’t change your own role.", (await self.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("role").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'RoleChanged'"));
    }

    [Fact]
    public async Task Removing_access_ends_the_next_request_keeps_history_and_is_audited()
    {
        var removed = await _factory.ClientFor(Tom).DeleteAsync($"/staff/{Aisha}");

        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.ClientFor(Aisha).GetAsync("/sessions/today")).StatusCode);
        var staff = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/staff");
        Assert.DoesNotContain(staff.GetProperty("members").EnumerateArray(), m => m.GetProperty("name").GetString() == "Aisha Bello");
        Assert.Single(Query("SELECT Id FROM Memberships WHERE RemovedAt IS NOT NULL"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Membership' AND Action = 'Deleted'"));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _factory.ClientFor(Tom).DeleteAsync($"/staff/{Tom}")).StatusCode);
    }

    [Fact]
    public async Task An_invitation_can_be_withdrawn()
    {
        var id = (await (await _factory.ClientFor(Tom).PostAsJsonAsync("/staff/invitations", new { email = "sam@harbourview.example", role = "YouthWorker" })).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var withdrawn = await _factory.ClientFor(Tom).DeleteAsync($"/staff/invitations/{id}");

        Assert.Equal(HttpStatusCode.NoContent, withdrawn.StatusCode);
        Assert.Empty((await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/staff")).GetProperty("invitations").EnumerateArray());
    }

    [Fact]
    public async Task Only_admins_manage_staff_and_never_another_organizations()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync("/staff")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).PostAsJsonAsync("/staff/invitations", new { email = "x@y.example", role = "YouthWorker" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PutAsJsonAsync($"/staff/{Jaylen}/role", new { role = "Admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/staff/{Jaylen}")).StatusCode);
    }

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

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
