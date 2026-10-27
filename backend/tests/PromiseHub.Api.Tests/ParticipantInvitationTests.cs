using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-051, L2-052
// Description: an admin invites a mentor or volunteer from Staff and roles; the Mentor role needs Mentoring on and youth come from the child record.
public sealed partial class ParticipantInvitationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Priya = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");

    private static readonly string[] SuiteAndLearning = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_invites_a_mentor_while_Mentoring_is_on_and_a_volunteer_at_any_time()
    {
        var mentor = await Invite(Tom, "grace.adeyemi@example.org", "Mentor");
        var volunteer = await Invite(Tom, "ravi.patel@example.org", "Volunteer");

        Assert.Equal(HttpStatusCode.Created, mentor.StatusCode);
        Assert.Equal(HttpStatusCode.Created, volunteer.StatusCode);
        var roles = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/staff")).GetProperty("invitations").EnumerateArray().Select(i => i.GetProperty("role").GetString()!).Order().ToArray();
        Assert.Equal(["Mentor", "Volunteer"], roles);
    }

    [Fact]
    public async Task With_Mentoring_off_a_mentor_invitation_is_refused_and_nothing_is_sent()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = SuiteAndLearning });

        var response = await Invite(Tom, "grace.adeyemi@example.org", "Mentor");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Turn on Mentoring to invite mentors.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("role").GetString());
        Assert.Empty(Email.Sent);
    }

    [Fact]
    public async Task A_youth_invitation_from_staff_and_roles_is_refused()
    {
        var response = await Invite(Tom, "yusuf.haddad@example.com", "Youth");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Invite youth from their child record.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("role").GetString());
    }

    [Fact]
    public async Task A_coordinator_still_invites_youth_workers_only()
    {
        var response = await Invite(Priya, "ravi.patel@example.org", "Volunteer");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Accepting_a_mentor_invitation_creates_a_mentor_account_in_the_organization()
    {
        await Invite(Tom, "grace.adeyemi@example.org", "Mentor");
        var token = LinkPattern().Match(Email.Bodies.Last(b => b.To == "grace.adeyemi@example.org").Body).Groups["token"].Value;

        var accepted = await _factory.CreateClient().PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Grace Adeyemi", password = "mentoring on thursdays" });

        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        var membership = Guid.Parse(Assert.Single(Query("SELECT Id FROM Memberships WHERE Email = 'grace.adeyemi@example.org' AND Role = 'Mentor' AND ChildId IS NULL")));
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(membership).GetAsync("/mentoring/youth")).StatusCode);
    }

    private Task<HttpResponseMessage> Invite(Guid who, string email, string role) =>
        _factory.ClientFor(who).PostAsJsonAsync("/staff/invitations", new { email, role });

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
