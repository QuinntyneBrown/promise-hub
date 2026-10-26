using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-052, L2-001
// Description: admins see waiting and expired invitations, resend a fresh link or withdraw one; used and withdrawn links answer 410 with the reason.
public sealed partial class PendingInvitationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Waiting_and_expired_invitations_are_listed_with_their_status_and_child()
    {
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/children/{Yusuf}/youth-invitation", new { email = "yusuf.haddad@example.com" });
        _factory.Clock.Advance(TimeSpan.FromDays(15));
        await Invite("grace.adeyemi@example.org", "Mentor");

        var invitations = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/staff")).GetProperty("invitations").EnumerateArray().ToList();

        var yusuf = invitations.Single(i => i.GetProperty("email").GetString() == "yusuf.haddad@example.com");
        Assert.Equal("Expired", yusuf.GetProperty("status").GetString());
        Assert.Equal("Yusuf Haddad", yusuf.GetProperty("childName").GetString());
        Assert.False(yusuf.GetProperty("replacementRequested").GetBoolean());
        var grace = invitations.Single(i => i.GetProperty("email").GetString() == "grace.adeyemi@example.org");
        Assert.Equal("Pending", grace.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, grace.GetProperty("childName").ValueKind);
    }

    [Fact]
    public async Task Resending_emails_a_fresh_link_for_14_days_the_old_link_stops_working_and_it_is_audited()
    {
        var id = await Invite("grace.adeyemi@example.org", "Mentor");
        var first = Token("grace.adeyemi@example.org");
        _factory.Clock.Advance(TimeSpan.FromDays(15));

        var resent = await _factory.ClientFor(Tom).PostAsync($"/staff/invitations/{id}/resend", null);

        Assert.Equal(HttpStatusCode.NoContent, resent.StatusCode);
        var second = Token("grace.adeyemi@example.org");
        Assert.NotEqual(first, second);
        Assert.Equal(HttpStatusCode.Gone, (await _factory.CreateClient().GetAsync($"/invitations/{first}")).StatusCode);
        _factory.Clock.Advance(TimeSpan.FromDays(13));
        Assert.Equal(HttpStatusCode.OK, (await _factory.CreateClient().GetAsync($"/invitations/{second}")).StatusCode);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'StaffInvitation' AND Summary = 'Invitation to grace.adeyemi@example.org resent by Tom Nguyen'"));
    }

    [Fact]
    public async Task An_accepted_withdrawn_or_other_organizations_invitation_cannot_be_resent()
    {
        var accepted = await Invite("grace.adeyemi@example.org", "Mentor");
        await _factory.CreateClient().PostAsJsonAsync($"/invitations/{Token("grace.adeyemi@example.org")}/accept", new { name = "Grace Adeyemi", password = "mentoring on thursdays" });
        var withdrawn = await Invite("ravi.patel@example.org", "Volunteer");
        await _factory.ClientFor(Tom).DeleteAsync($"/staff/invitations/{withdrawn}");
        var open = await Invite("sam@harbourview.example", "YouthWorker");

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).PostAsync($"/staff/invitations/{accepted}/resend", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).PostAsync($"/staff/invitations/{withdrawn}/resend", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsync($"/staff/invitations/{open}/resend", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/staff/invitations/{open}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).PostAsync($"/staff/invitations/{open}/resend", null)).StatusCode);
    }

    [Fact]
    public async Task A_used_or_withdrawn_link_answers_410_with_the_reason_and_withdrawing_is_audited()
    {
        await Invite("grace.adeyemi@example.org", "Mentor");
        var used = Token("grace.adeyemi@example.org");
        await _factory.CreateClient().PostAsJsonAsync($"/invitations/{used}/accept", new { name = "Grace Adeyemi", password = "mentoring on thursdays" });
        var withdrawnId = await Invite("ravi.patel@example.org", "Volunteer");
        var withdrawn = Token("ravi.patel@example.org");
        await _factory.ClientFor(Tom).DeleteAsync($"/staff/invitations/{withdrawnId}");

        Assert.Equal("used", await Reason(await _factory.CreateClient().GetAsync($"/invitations/{used}")));
        Assert.Equal("withdrawn", await Reason(await _factory.CreateClient().GetAsync($"/invitations/{withdrawn}")));
        Assert.Equal("withdrawn", await Reason(await _factory.CreateClient().PostAsJsonAsync($"/invitations/{withdrawn}/accept", new { name = "Ravi", password = "saturday sports helper" })));
        var unknown = await _factory.CreateClient().GetAsync("/invitations/not-a-token");
        Assert.Equal("used", await Reason(unknown));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'StaffInvitation' AND Action = 'Deleted'"));
    }

    private static async Task<string?> Reason(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("reason").GetString();
    }

    private async Task<Guid> Invite(string email, string role)
    {
        var response = await _factory.ClientFor(Tom).PostAsJsonAsync("/staff/invitations", new { email, role });
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
