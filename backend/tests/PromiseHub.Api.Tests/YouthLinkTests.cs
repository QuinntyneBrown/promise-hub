using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-045 youth accounts linked to a child record; L2-007 criterion 9 a youth reads only their own record.
public sealed class YouthLinkTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Priya = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");

    private static readonly string[] Learning = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_links_a_youth_account_to_a_child_and_the_youth_then_reads_only_that_child()
    {
        var response = await Link(Tom, Sofia, Jordan);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Learning });
        var me = await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>("/learning/me");
        var child = me.GetProperty("child");
        Assert.Equal(Jordan, child.GetProperty("id").GetGuid());
        Assert.Equal("Jordan", child.GetProperty("firstName").GetString());
        Assert.Equal("Thompson", child.GetProperty("lastName").GetString());
        Assert.Equal(11, child.GetProperty("age").GetInt32());
        Assert.Equal(4, child.EnumerateObject().Count());
    }

    [Fact]
    public async Task Linking_is_audited_with_who_which_account_and_which_child()
    {
        await Link(Tom, Sofia, Jordan);

        var row = Assert.Single(Query("SELECT ActorName, Summary FROM AuditEntries WHERE Action = 'YouthLinked'"));
        Assert.StartsWith("Tom Nguyen|", row);
        Assert.Contains("Sofía Rivera", row);
        Assert.Contains("Jordan Thompson", row);
    }

    [Fact]
    public async Task Another_organizations_child_or_account_is_not_found_and_nothing_changes()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Link(Tom, Sofia, NorthgateMateo)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Link(Tom, Lucia, Jordan)).StatusCode);
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE Action = 'YouthLinked'"));
    }

    [Fact]
    public async Task A_child_with_a_youth_account_cannot_be_linked_to_a_second_one()
    {
        await Link(Tom, Sofia, Jordan);

        var response = await Link(Tom, Nadia, Jordan);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("This child already has a youth account.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("childId").GetString());
    }

    [Fact]
    public async Task Only_a_youth_account_links_to_a_child()
    {
        var response = await Link(Tom, Daniel, Jordan);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Only a youth account links to a child.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("membershipId").GetString());
    }

    [Fact]
    public async Task Only_admins_link_youth_accounts()
    {
        foreach (var who in new[] { Marisol, Jaylen, Priya, Sofia, Daniel })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Link(who, Sofia, Jordan)).StatusCode);
        }
    }

    private Task<HttpResponseMessage> Link(Guid admin, Guid membership, Guid child) =>
        _factory.ClientFor(admin).PutAsJsonAsync($"/staff/{membership}/child", new { childId = child });

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
