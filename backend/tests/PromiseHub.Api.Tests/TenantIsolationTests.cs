using System.Net;
using System.Net.Http.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-001: every query filters by the active membership's organization, never by a client value.
public sealed class TenantIsolationTests(PromiseHubApiFactory factory) : IClassFixture<PromiseHubApiFactory>
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid HarbourviewMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");

    [Fact]
    public async Task Staff_member_reads_a_child_of_their_own_organization()
    {
        var child = await factory.ClientFor(Jaylen).GetFromJsonAsync<ChildResponse>($"/children/{HarbourviewMateo}");

        Assert.Equal("Mateo Rivera", child!.Name);
    }

    [Fact]
    public async Task Request_for_another_organizations_child_answers_404_and_is_audited()
    {
        var response = await factory.ClientFor(Jaylen).GetAsync($"/children/{NorthgateMateo}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var entries = Query($"SELECT OrganizationId, ActorName FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordId = '{NorthgateMateo.ToString().ToUpperInvariant()}'");
        Assert.Equal([$"{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}|Jaylen Okafor"], entries);
    }

    [Fact]
    public async Task Unknown_child_answers_404_without_an_access_denied_entry()
    {
        var unknown = Guid.NewGuid();

        var response = await factory.ClientFor(Jaylen).GetAsync($"/children/{unknown}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE RecordId = '{unknown.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task Organization_id_supplied_by_the_client_is_ignored()
    {
        var session = await factory.ClientFor(Jaylen).GetFromJsonAsync<SessionResponse>($"/me?organizationId={DatabaseSeeder.Northgate}");

        Assert.Equal("Harbourview Youth Collective", session!.OrganizationName);
        Assert.Equal("Jaylen Okafor", session.PersonName);
        Assert.Equal("SiteLead", session.Role);
    }

    [Fact]
    public async Task Same_person_sees_the_organization_of_the_membership_they_are_signed_in_to()
    {
        var priyaAtNorthgate = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "priya@harbourview.example");

        var session = await factory.ClientFor(priyaAtNorthgate).GetFromJsonAsync<SessionResponse>("/me");

        Assert.Equal("Northgate Community Church Kids", session!.OrganizationName);
    }

    [Theory]
    [InlineData("/me")]
    [InlineData("/children/00000000-0000-0000-0000-000000000001")]
    public async Task Anonymous_requests_answer_401(string path)
    {
        var response = await factory.CreateClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Session_naming_a_membership_that_does_not_exist_answers_401()
    {
        var response = await factory.ClientFor(Guid.NewGuid()).GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(factory.ConnectionString);
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

    private sealed record ChildResponse(Guid Id, string Name);

    private sealed record SessionResponse(string PersonName, string Role, string OrganizationName);
}
