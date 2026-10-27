using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-085 criteria 4 to 6 (a program director awards a badge by hand: once, to an active youth of the
// organization, notified and audited; automatic and deleted badges, roles, tenants and the Learning gate), L2-032.
public sealed class BadgeManualAwardTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();
    private Guid _badge;

    [Fact]
    public async Task Marisol_awards_a_badge_by_hand_with_her_name_and_the_youth_is_notified()
    {
        var before = await Get(Marisol, $"/curriculum/badges/{_badge}");
        Assert.Equal(["Nadia Haddad", "Sofía Rivera"], before.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()));

        Assert.Equal(HttpStatusCode.Created, (await Award(Marisol, Nadia)).StatusCode);

        var after = await Get(Marisol, $"/curriculum/badges/{_badge}");
        var award = Assert.Single(after.GetProperty("awards").EnumerateArray());
        Assert.Equal("Nadia Haddad", award.GetProperty("youthName").GetString());
        Assert.Equal("Marisol Delgado", award.GetProperty("awardedBy").GetString());
        Assert.Equal(["Sofía Rivera"], after.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()));
        var notifications = (await Get(Nadia, "/notifications")).GetProperty("items").EnumerateArray();
        Assert.Contains(notifications, n => n.GetProperty("text").GetString() == "Marisol Delgado awarded you the Speaks Up badge.");
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'BadgeAward'"), s => s.Contains("Speaks Up awarded to Nadia Haddad by Marisol Delgado"));
        Assert.Equal(1, (await Get(Marisol, "/curriculum/badges")).GetProperty("badges")[0].GetProperty("earnedCount").GetInt32());
    }

    [Fact]
    public async Task A_youth_who_holds_it_an_automatic_badge_and_a_youth_outside_the_organization_are_refused()
    {
        await Award(Marisol, Nadia);

        var again = await Award(Marisol, Nadia);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("already-awarded", (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        var automatic = await Created(await Post(Marisol, "/curriculum/badges", new { name = "Quiz Champion", icon = "award", kind = "Automatic", rule = "ModuleCompleted", targetId = await ModuleAsync() }));
        var auto = await Post(Marisol, $"/curriculum/badges/{automatic}/awards", new { membershipId = Sofia });
        Assert.Equal(HttpStatusCode.Conflict, auto.StatusCode);
        Assert.Equal("automatic", (await auto.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        foreach (var who in new Guid?[] { null, Jaylen, Lucia, Guid.NewGuid() })
        {
            Assert.Equal("Choose a youth of your organization.", await Error(await Post(Marisol, $"/curriculum/badges/{_badge}/awards", new { membershipId = who }), "membershipId"));
        }
        Assert.Single((await Get(Marisol, $"/curriculum/badges/{_badge}")).GetProperty("awards").EnumerateArray());
    }

    [Fact]
    public async Task Awards_are_refused_to_other_roles_other_organizations_deleted_badges_and_with_Learning_off()
    {
        foreach (var who in new[] { Jaylen, Daniel, Sofia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Award(who, Nadia)).StatusCode);
        }
        var northgate = (await Get(Grace, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).Append("Learning").ToArray();
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = northgate });
        Assert.Equal(HttpStatusCode.NotFound, (await Award(Grace, Lucia)).StatusCode);
        var gone = await Created(await Post(Marisol, "/curriculum/badges", new { name = "Gone", icon = "star", kind = "Manual" }));
        await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/badges/{gone}");
        Assert.Equal(HttpStatusCode.NotFound, (await Post(Marisol, $"/curriculum/badges/{gone}/awards", new { membershipId = Nadia })).StatusCode);
        var on = (await Get(Tom, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).Where(m => m != "Learning").ToArray();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on });
        Assert.Equal(HttpStatusCode.NotFound, (await Award(Marisol, Nadia)).StatusCode);
        Assert.Empty(Query("SELECT Id FROM BadgeAwards"));
    }

    private Task<HttpResponseMessage> Award(Guid who, Guid youth) => Post(who, $"/curriculum/badges/{_badge}/awards", new { membershipId = youth });

    private async Task<Guid> ModuleAsync()
    {
        var track = await Created(await Post(Marisol, "/curriculum/tracks", new { name = "Leadership Foundations" }));
        return await Created(await Post(Marisol, "/curriculum/modules", new { trackId = track, title = "Leading by Serving" }));
    }

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private static async Task<string?> Error(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString();
    }

    private Task<HttpResponseMessage> Post(Guid membership, string path, object body) => _factory.ClientFor(membership).PostAsJsonAsync(path, body);

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

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
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
        }
        return rows;
    }

    public async Task InitializeAsync() =>
        _badge = await Created(await Post(Marisol, "/curriculum/badges", new { name = "Speaks Up", icon = "flag", description = "Shared an idea with the whole group.", kind = "Manual" }));

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
