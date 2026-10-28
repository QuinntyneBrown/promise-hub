using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-117 criteria 2 to 6, L2-001, L2-032
// Description: anyone signed in changes the name and mobile of their active membership only; the email and a youth's name are
// managed elsewhere; the change is validated and audited without its values.
public sealed class ProfileTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid PriyaAtNorthgate = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "priya@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Saving_changes_the_name_and_mobile_and_is_audited_without_the_values()
    {
        var saved = await Save(Jaylen, "Jaylen O. Okafor", "905-555-0182");

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var account = await Account(Jaylen);
        Assert.Equal("Jaylen O. Okafor", account.GetProperty("name").GetString());
        Assert.Equal("905-555-0182", account.GetProperty("mobile").GetString());
        Assert.Equal("Jaylen O. Okafor", (await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>("/me")).GetProperty("personName").GetString());
        var summary = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Membership' AND Summary LIKE '%profile%'"));
        Assert.DoesNotContain("905", summary);
    }

    [Fact]
    public async Task An_empty_mobile_clears_it_and_a_mentor_saves_his_own()
    {
        await Save(Daniel, "Daniel Osei", "905-555-0144");

        Assert.Equal(HttpStatusCode.NoContent, (await Save(Daniel, "Daniel Osei", "")).StatusCode);

        Assert.Equal(JsonValueKind.Null, (await Account(Daniel)).GetProperty("mobile").ValueKind);
    }

    [Fact]
    public async Task An_empty_or_long_name_and_a_mobile_without_area_code_are_refused_and_nothing_changes()
    {
        var invalid = await Save(Jaylen, "  ", "555-0181");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter your name.", errors.GetProperty("name").GetString());
        Assert.Equal("Include the area code, like 905-555-0101.", errors.GetProperty("mobile").GetString());
        var tooLong = await Save(Jaylen, new string('J', 101), null);
        Assert.Equal("Use at most 100 characters.",
            (await tooLong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("name").GetString());
        Assert.Equal("Jaylen Okafor", (await Account(Jaylen)).GetProperty("name").GetString());
    }

    [Fact]
    public async Task A_youth_keeps_the_name_from_her_record_but_can_set_her_mobile()
    {
        var renamed = await Save(Sofia, "Sofi Rivera", null);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, renamed.StatusCode);
        Assert.Equal("Your name comes from your record. Ask staff to change it.",
            (await renamed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.NoContent, (await Save(Sofia, "Sofía Rivera", "905-555-0123")).StatusCode);
        var account = await Account(Sofia);
        Assert.Equal("Sofía Rivera", account.GetProperty("name").GetString());
        Assert.Equal("905-555-0123", account.GetProperty("mobile").GetString());
    }

    [Fact]
    public async Task Only_the_active_membership_changes_and_another_organization_keeps_its_own()
    {
        await Save(PriyaAtHarbourview, "Priya R. Raman", "905-555-0177");

        var northgate = await Account(PriyaAtNorthgate);
        Assert.Equal("Priya Raman", northgate.GetProperty("name").GetString());
        Assert.Equal(JsonValueKind.Null, northgate.GetProperty("mobile").ValueKind);
        Assert.Single(Query($"SELECT OrganizationId FROM AuditEntries WHERE RecordType = 'Membership' AND Summary LIKE '%profile%'"),
            id => Guid.Parse(id) == DatabaseSeeder.Harbourview);
    }

    [Fact]
    public async Task Without_a_session_saving_answers_401()
    {
        var anonymous = await _factory.CreateClient().PutAsJsonAsync("/me/profile", new { name = "Someone", mobile = (string?)null });

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    private Task<HttpResponseMessage> Save(Guid who, string name, string? mobile) =>
        _factory.ClientFor(who).PutAsJsonAsync("/me/profile", new { name, mobile });

    private async Task<JsonElement> Account(Guid who) => await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/me/account");

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
