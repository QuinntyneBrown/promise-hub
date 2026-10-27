using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-054, L2-001, L2-032
// Description: an expired link answers 410 "expired" and its holder asks, once, for a new one; the organization's admins are told.
public sealed partial class ExpiredInvitationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_expired_link_answers_410_expired_with_who_invited_and_where()
    {
        var token = await ExpiredYouthInvitation();

        var response = await _factory.CreateClient().GetAsync($"/invitations/{token}");

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("expired", body.GetProperty("reason").GetString());
        Assert.Equal("Tom Nguyen", body.GetProperty("invitedBy").GetString());
        Assert.Equal("Harbourview Youth Collective", body.GetProperty("organization").GetString());
    }

    [Fact]
    public async Task Asking_for_a_new_link_marks_the_invitation_tells_the_admins_and_is_audited_once()
    {
        var token = await ExpiredYouthInvitation();

        var first = await _factory.CreateClient().PostAsync($"/invitations/{token}/request-new", null);
        var second = await _factory.CreateClient().PostAsync($"/invitations/{token}/request-new", null);

        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, second.StatusCode);
        var invitation = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/staff")).GetProperty("invitations").EnumerateArray().Single();
        Assert.True(invitation.GetProperty("replacementRequested").GetBoolean());
        var notice = Assert.Single((await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray());
        Assert.Equal("yusuf.haddad@example.com asked for a new invitation link", notice.GetProperty("text").GetString());
        Assert.Equal("/settings/staff", notice.GetProperty("link").GetString());
        Assert.Empty((await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray());
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'StaffInvitation' AND Summary = 'yusuf.haddad@example.com asked for a new invitation link' AND OrganizationId = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task Another_organizations_admins_see_nothing_of_the_request()
    {
        var token = await ExpiredYouthInvitation();

        await _factory.CreateClient().PostAsync($"/invitations/{token}/request-new", null);

        Assert.Empty((await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray());
        Assert.Empty((await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/staff")).GetProperty("invitations").EnumerateArray());
        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE Summary LIKE '%new invitation link%' AND OrganizationId = '{DatabaseSeeder.Northgate.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task An_open_withdrawn_used_or_unknown_link_cannot_ask_for_a_new_one()
    {
        await Invite("grace.adeyemi@example.org");
        var open = Token("grace.adeyemi@example.org");
        var withdrawnId = await Invite("ravi.patel@example.org");
        var withdrawn = Token("ravi.patel@example.org");
        await _factory.ClientFor(Tom).DeleteAsync($"/staff/invitations/{withdrawnId}");
        await Invite("sam@harbourview.example");
        var used = Token("sam@harbourview.example");
        await _factory.CreateClient().PostAsJsonAsync($"/invitations/{used}/accept", new { name = "Sam Ortiz", password = "a long passphrase 42" });

        foreach (var token in new[] { open, withdrawn, used, "not-a-token" })
        {
            Assert.Equal(HttpStatusCode.NotFound, (await _factory.CreateClient().PostAsync($"/invitations/{token}/request-new", null)).StatusCode);
        }
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE Summary LIKE '%new invitation link%'"));
    }

    private async Task<string> ExpiredYouthInvitation()
    {
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/children/{Yusuf}/youth-invitation", new { email = "yusuf.haddad@example.com" });
        _factory.Clock.Advance(TimeSpan.FromDays(15));
        return Token("yusuf.haddad@example.com");
    }

    private async Task<Guid> Invite(string email)
    {
        var response = await _factory.ClientFor(Tom).PostAsJsonAsync("/staff/invitations", new { email, role = "Volunteer" });
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private string Token(string to) => LinkPattern().Match(Email.Bodies.Last(b => b.To == to).Body).Groups["token"].Value;

    [GeneratedRegex(@"/invite/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex LinkPattern();

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
