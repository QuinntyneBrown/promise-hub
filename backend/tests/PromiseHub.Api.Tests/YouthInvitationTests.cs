using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-051, L2-052, L2-045
// Description: an admin invites a youth from their child record; accepting creates a Youth account linked to that child.
public sealed partial class YouthInvitationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Priya = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid NorthgateLucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");

    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_invites_a_youth_from_the_child_record_and_the_link_is_emailed_and_audited()
    {
        Assert.Equal("None", (await Account(Yusuf)).GetProperty("status").GetString());

        var invited = await Invite(Tom, Yusuf, "Yusuf.Haddad@example.com");

        Assert.Equal(HttpStatusCode.Created, invited.StatusCode);
        Assert.Contains(Email.Sent, e => e.To == "yusuf.haddad@example.com" && e.Subject == "Join Harbourview Youth Collective on PromiseHub");
        Assert.Contains("/invite/", Email.Bodies.Single(b => b.To == "yusuf.haddad@example.com").Body, StringComparison.Ordinal);
        var account = await Account(Yusuf);
        Assert.Equal("Invited", account.GetProperty("status").GetString());
        Assert.Equal("yusuf.haddad@example.com", account.GetProperty("email").GetString());
        var audit = Assert.Single(Query("SELECT ActorName, Summary FROM AuditEntries WHERE RecordType = 'StaffInvitation' AND Action = 'Created'"));
        Assert.Equal("Tom Nguyen|yusuf.haddad@example.com invited as Youth for Yusuf Haddad by Tom Nguyen", audit);
    }

    [Fact]
    public async Task Ages_outside_12_to_18_an_existing_account_a_waiting_invitation_or_a_bad_email_are_named_and_nothing_is_sent()
    {
        await Invite(Tom, Yusuf, "yusuf.haddad@example.com");

        Assert.Equal("Youth accounts are for ages 12 to 18.", await Error(await Invite(Tom, Amara, "amara@example.com"), "childId"));
        Assert.Equal("Sofía Rivera already has a youth account.", await Error(await Invite(Tom, SofiaChild, "sofia2@example.com"), "childId"));
        Assert.Equal("An invitation for Yusuf Haddad is already waiting.", await Error(await Invite(Tom, Yusuf, "other@example.com"), "childId"));
        Assert.Equal("Enter an email like name@example.org.", await Error(await InviteFor("Jordan Thompson", "nope"), "email"));
        Assert.Equal("Jaylen Okafor already has access.", await Error(await InviteFor("Jordan Thompson", "jaylen@harbourview.example"), "email"));
        Assert.Single(Email.Sent);
    }

    [Fact]
    public async Task With_Learning_off_both_endpoints_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/children/{Yusuf}/youth-account")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Invite(Tom, Yusuf, "yusuf.haddad@example.com")).StatusCode);
        Assert.Empty(Email.Sent);
    }

    [Fact]
    public async Task Another_organizations_child_is_not_found_and_nothing_is_stored()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Invite(Tom, NorthgateLucia, "lucia2@example.com")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/children/{NorthgateLucia}/youth-account")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/children/{Yusuf}/youth-account")).StatusCode);
        Assert.Empty(Query("SELECT Id FROM StaffInvitations"));
    }

    [Fact]
    public async Task Only_admins_invite_youth()
    {
        foreach (var who in new[] { Marisol, Jaylen, Priya, Aisha, Sofia, Daniel, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Invite(who, Yusuf, "yusuf.haddad@example.com")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/children/{Yusuf}/youth-account")).StatusCode);
        }
    }

    [Fact]
    public async Task Accepting_a_youth_invitation_creates_a_youth_account_linked_to_the_child()
    {
        await Invite(Tom, Yusuf, "yusuf.haddad@example.com");
        var token = Token("yusuf.haddad@example.com");
        var browser = _factory.CreateClient();

        var invitation = await browser.GetFromJsonAsync<JsonElement>($"/invitations/{token}");
        var accepted = await browser.PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Yusuf Haddad", password = "lanterns over the harbour" });

        Assert.Equal("Youth", invitation.GetProperty("role").GetString());
        Assert.Equal("Yusuf Haddad", invitation.GetProperty("suggestedName").GetString());
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        var membership = Guid.Parse(Assert.Single(Query($"SELECT Id FROM Memberships WHERE Email = 'yusuf.haddad@example.com' AND Role = 'Youth' AND ChildId = '{Yusuf.ToString().ToUpperInvariant()}'")));
        var child = (await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/learning/me")).GetProperty("child");
        Assert.Equal(Yusuf, child.GetProperty("id").GetGuid());
        var account = await Account(Yusuf);
        Assert.Equal("Active", account.GetProperty("status").GetString());
        Assert.Equal("Yusuf Haddad", account.GetProperty("name").GetString());
    }

    private async Task<HttpResponseMessage> InviteFor(string child, string email) =>
        await Invite(Tom, DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, child), email);

    private Task<HttpResponseMessage> Invite(Guid who, Guid child, string email) =>
        _factory.ClientFor(who).PostAsJsonAsync($"/children/{child}/youth-invitation", new { email });

    private async Task<JsonElement> Account(Guid child) =>
        await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/children/{child}/youth-account");

    private static async Task<string?> Error(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString();
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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
