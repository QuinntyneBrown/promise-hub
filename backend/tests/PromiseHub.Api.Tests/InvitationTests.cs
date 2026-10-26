using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Staff;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-009 criteria 1 to 3 and 7: an invited worker accepts, sets a password, saves a phone and is signed in to the right organization.
public sealed class InvitationTests : IAsyncLifetime
{
    private readonly SignInApiFactory _factory = new();

    [Fact]
    public async Task An_open_invitation_shows_the_email_organization_and_role()
    {
        var token = await Invite("sam@harbourview.example", Role.YouthWorker);

        var invitation = await _factory.NewBrowser().GetFromJsonAsync<JsonElement>($"/invitations/{token}");

        Assert.Equal("sam@harbourview.example", invitation.GetProperty("email").GetString());
        Assert.Equal("Harbourview Youth Collective", invitation.GetProperty("organization").GetString());
        Assert.Equal("YouthWorker", invitation.GetProperty("role").GetString());
        Assert.Equal("Tom Nguyen", invitation.GetProperty("invitedBy").GetString());
    }

    [Fact]
    public async Task An_expired_withdrawn_or_unknown_invitation_is_gone_with_who_to_ask()
    {
        var token = await Invite("sam@harbourview.example", Role.YouthWorker);
        _factory.Clock.Advance(TimeSpan.FromDays(15));

        var expired = await _factory.NewBrowser().GetAsync($"/invitations/{token}");
        var unknown = await _factory.NewBrowser().GetAsync("/invitations/not-a-token");

        Assert.Equal(HttpStatusCode.Gone, expired.StatusCode);
        Assert.Equal("Tom Nguyen", (await expired.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("invitedBy").GetString());
        Assert.Equal(HttpStatusCode.Gone, unknown.StatusCode);
    }

    [Fact]
    public async Task Accepting_creates_the_account_and_membership_and_signs_in_once()
    {
        var token = await Invite("sam@harbourview.example", Role.YouthWorker);
        var browser = _factory.NewBrowser();

        var accepted = await browser.PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Sam Ortiz", password = "a long passphrase 42" });
        var me = await browser.GetFromJsonAsync<JsonElement>("/me");
        var again = await _factory.NewBrowser().PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Someone Else", password = "a long passphrase 42" });

        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        Assert.Equal("Sam Ortiz", me.GetProperty("personName").GetString());
        Assert.Equal("YouthWorker", me.GetProperty("role").GetString());
        Assert.Equal("Harbourview Youth Collective", me.GetProperty("organizationName").GetString());
        Assert.Equal(HttpStatusCode.Gone, again.StatusCode);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'StaffInvitation' AND Summary LIKE '%accepted%'"));
    }

    [Fact]
    public async Task A_missing_name_or_short_password_is_named()
    {
        var token = await Invite("sam@harbourview.example", Role.YouthWorker);

        var invalid = await _factory.NewBrowser().PostAsJsonAsync($"/invitations/{token}/accept", new { name = " ", password = "short" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter your name.", errors.GetProperty("name").GetString());
        Assert.Equal("Use at least 12 characters.", errors.GetProperty("password").GetString());
    }

    [Fact]
    public async Task The_phone_step_needs_an_area_code_and_saves_the_mobile_for_alerts()
    {
        var token = await Invite("sam@harbourview.example", Role.YouthWorker);
        var browser = _factory.NewBrowser();
        await browser.PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Sam Ortiz", password = "a long passphrase 42" });

        var noArea = await browser.PutAsJsonAsync("/me/phone", new { mobile = "555-0101" });
        var saved = await browser.PutAsJsonAsync("/me/phone", new { mobile = "905-555-0101" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, noArea.StatusCode);
        Assert.Equal("Include the area code, like 905-555-0101.", (await noArea.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("mobile").GetString());
        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.Single(Query("SELECT Id FROM Memberships WHERE Mobile = '905-555-0101'"));
    }

    [Fact]
    public async Task An_invitation_joins_only_its_own_organization()
    {
        var token = await Invite("sam@harbourview.example", Role.SiteLead, DatabaseSeeder.Northgate);
        var browser = _factory.NewBrowser();

        await browser.PostAsJsonAsync($"/invitations/{token}/accept", new { name = "Sam Ortiz", password = "a long passphrase 42" });

        Assert.Equal("Northgate Community Church Kids", (await browser.GetFromJsonAsync<JsonElement>("/me")).GetProperty("organizationName").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await browser.GetAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026")}")).StatusCode);
    }

    /// <summary>An invitation as an admin would send it, with a known token.</summary>
    private async Task<string> Invite(string email, Role role, Guid? organizationId = null)
    {
        var token = GuardianTokens.New();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IPromiseHubDb>();
        scope.ServiceProvider.GetRequiredService<PromiseHub.Application.Organizations.TenantContext>().ResolveForJob(organizationId ?? DatabaseSeeder.Harbourview);
        db.StaffInvitations.Add(new StaffInvitation(Guid.NewGuid(), organizationId ?? DatabaseSeeder.Harbourview, email, role, GuardianTokens.Hash(token), "Tom Nguyen", _factory.Clock.GetUtcNow()));
        await db.SaveChangesAsync();
        return token;
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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
