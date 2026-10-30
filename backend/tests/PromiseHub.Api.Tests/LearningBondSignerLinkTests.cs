using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-137 the named signer's own page behind the emailed link (ADR 0078): anonymous, served while Learning Bond is off, the authority box,
// the acceptance with the signer's name, title and email, the admin told, the link dead afterwards; L2-162 per organization.
public sealed partial class LearningBondSignerLinkTests : IAsyncLifetime
{
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    // L2-137 criterion 8: no sign-in, and Northgate has Learning Bond off.
    [Fact]
    public async Task Opening_the_link_shows_the_agreement_and_who_asked_with_no_sign_in_while_Learning_Bond_is_off()
    {
        var token = await RequestSigner();

        var response = await _factory.CreateClient().GetAsync($"/sign/learning-bond/{token}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Northgate Community Church Kids", page.GetProperty("organization").GetString());
        Assert.Equal("Grace Mensah", page.GetProperty("requestedBy").GetString());
        Assert.Equal("Rev. Angela Baptiste", page.GetProperty("name").GetString());
        Assert.Equal("Board chair", page.GetProperty("title").GetString());
        Assert.Equal(2, page.GetProperty("version").GetInt32());
        Assert.Equal(["What we collect", "Where it goes", "What your organization sees"],
            page.GetProperty("sections").EnumerateArray().Select(s => s.GetProperty("title").GetString()!));
        Assert.False(page.TryGetProperty("email", out _));
    }

    // L2-137 criterion 8: the authority box is required, and a refusal uses nothing up.
    [Fact]
    public async Task Accepting_without_the_authority_box_is_refused_stores_nothing_and_the_link_still_works()
    {
        var token = await RequestSigner();
        var anonymous = _factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync($"/sign/learning-bond/{token}/acceptances", new { authority = false });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Confirm you have authority to accept this agreement for Northgate Community Church Kids.",
            (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("authority").GetString());
        Assert.Equal("0", Scalar($"SELECT COUNT(*) FROM LearningBondAgreementAcceptances WHERE OrganizationId = '{Upper(DatabaseSeeder.Northgate)}'"));
        Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync($"/sign/learning-bond/{token}")).StatusCode);
    }

    // Grace at Northgate turns Messages on (Learning Bond needs Roster and Messages before the agreement is offered) and names Angela.
    private async Task<string> RequestSigner()
    {
        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);
        var response = await grace.PostAsJsonAsync("/learning-bond/agreement/signers",
            new { name = "Rev. Angela Baptiste", title = "Board chair", email = "angela.baptiste@northgate.example" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return LastLink();
    }

    private string LastLink() => SignerLink().Match(Email.Bodies[^1].Body).Groups[1].Value;

    [GeneratedRegex(@"/sign/learning-bond/([A-Za-z0-9_-]+)")]
    private static partial Regex SignerLink();

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

    private string Scalar(string sql) => Rows(sql).Single();

    private List<string> Rows(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(Convert.ToString(reader.GetValue(0), System.Globalization.CultureInfo.InvariantCulture)!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
