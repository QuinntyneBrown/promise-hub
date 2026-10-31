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
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

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

    // L2-137 criterion 2: the acceptance records the signer, Grace is told in the app and by email, and the link stops working.
    [Fact]
    public async Task Accepting_records_the_signer_tells_the_admin_and_the_link_stops_working()
    {
        var token = await RequestSigner();
        var anonymous = _factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync($"/sign/learning-bond/{token}/acceptances", new { authority = true });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var accepted = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Northgate Community Church Kids", accepted.GetProperty("organization").GetString());
        Assert.Equal("Grace Mensah", accepted.GetProperty("requestedBy").GetString());
        Assert.Equal("Rev. Angela Baptiste", accepted.GetProperty("name").GetString());
        Assert.Equal("Board chair", accepted.GetProperty("title").GetString());
        Assert.Equal("angela.baptiste@northgate.example", accepted.GetProperty("email").GetString());
        Assert.Equal(2, accepted.GetProperty("version").GetInt32());
        Assert.Equal(_factory.Clock.GetUtcNow(), accepted.GetProperty("acceptedAt").GetDateTimeOffset());
        Assert.Equal("Rev. Angela Baptiste|Board chair|angela.baptiste@northgate.example|2|",
            Scalar("SELECT AcceptedByName || '|' || SignerTitle || '|' || SignerEmail || '|' || AgreementVersion || '|' || COALESCE(AcceptedByMembershipId, '') FROM LearningBondAgreementAcceptances "
            + $"WHERE OrganizationId = '{Upper(DatabaseSeeder.Northgate)}'"));
        Assert.Equal("Signer: Rev. Angela Baptiste|Learning Bond data-handling agreement version 2 accepted by Rev. Angela Baptiste, Board chair",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'LearningBondAgreementAcceptance'"));

        var grace = _factory.ClientFor(Grace);
        var agreement = await grace.GetFromJsonAsync<JsonElement>("/learning-bond/agreement");
        Assert.Equal("Rev. Angela Baptiste", agreement.GetProperty("acceptance").GetProperty("acceptedBy").GetString());
        Assert.Equal(JsonValueKind.Null, agreement.GetProperty("signer").ValueKind);
        var notice = Assert.Single((await grace.GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray());
        Assert.Equal("agreement", notice.GetProperty("kind").GetString());
        Assert.Equal("Rev. Angela Baptiste, Board chair, accepted the Learning Bond data-handling agreement version 2.", notice.GetProperty("text").GetString());
        Assert.Equal("/settings/learning-bond/agreement", notice.GetProperty("link").GetString());
        var (to, subject) = Email.Sent[^1];
        Assert.Equal("grace@northgate.example", to);
        Assert.Equal("Rev. Angela Baptiste accepted the Learning Bond agreement", subject);
        Assert.DoesNotContain(token, string.Join('\n', Rows("SELECT Summary || COALESCE(BeforeJson, '') || COALESCE(AfterJson, '') FROM AuditEntries")), StringComparison.Ordinal);

        var again = await anonymous.GetAsync($"/sign/learning-bond/{token}");
        Assert.Equal(HttpStatusCode.Gone, again.StatusCode);
        Assert.Equal("This link has expired. Ask Northgate Community Church Kids to send a new one.",
            (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString());
        Assert.Equal(HttpStatusCode.Gone, (await anonymous.PostAsJsonAsync($"/sign/learning-bond/{token}/acceptances", new { authority = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "LearningBond" } })).StatusCode);
    }

    // L2-137 criterion 9: a replaced, expired or cancelled link says whom to ask and accepts nothing.
    [Fact]
    public async Task A_replaced_expired_or_cancelled_link_says_it_has_expired_naming_the_organization_and_accepts_nothing()
    {
        var grace = _factory.ClientFor(Grace);
        var anonymous = _factory.CreateClient();
        var replaced = await RequestSigner();
        var id = (await grace.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer").GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.NoContent, (await grace.PostAsync($"/learning-bond/agreement/signers/{id}/resend", null)).StatusCode);
        var expired = LastLink();

        await AssertExpired(anonymous, replaced);
        Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync($"/sign/learning-bond/{expired}")).StatusCode);
        _factory.Clock.Advance(TimeSpan.FromDays(14));
        await AssertExpired(anonymous, expired);

        var cancelled = await RequestSigner();
        id = (await grace.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer").GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.NoContent, (await grace.DeleteAsync($"/learning-bond/agreement/signers/{id}")).StatusCode);
        await AssertExpired(anonymous, cancelled);

        Assert.Equal("0", Scalar($"SELECT COUNT(*) FROM LearningBondAgreementAcceptances WHERE OrganizationId = '{Upper(DatabaseSeeder.Northgate)}'"));
    }

    // L2-137 criterion 9, L2-003: an unknown link names no one; a suspended organization's link stops working and nothing is deleted.
    [Fact]
    public async Task An_unknown_link_answers_404_and_a_suspended_organizations_link_has_expired()
    {
        var token = await RequestSigner();
        var anonymous = _factory.CreateClient();

        var unknown = await anonymous.GetAsync("/sign/learning-bond/not-a-link");
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal(string.Empty, await unknown.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.PostAsJsonAsync("/sign/learning-bond/not-a-link/acceptances", new { authority = true })).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent,
            (await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Northgate}/suspend", new { reason = "Unpaid since September" })).StatusCode);
        await AssertExpired(anonymous, token);
        Assert.Equal("1", Scalar("SELECT COUNT(*) FROM LearningBondSignerRequests"));
    }

    // L2-137 criterion 10, L2-162: Northgate's signer touches nothing of Harbourview's.
    [Fact]
    public async Task Northgates_signer_changes_nothing_of_Harbourviews()
    {
        var token = await RequestSigner();
        var harbourview = Upper(DatabaseSeeder.Harbourview);
        var before = Rows($"SELECT Id FROM LearningBondAgreementAcceptances WHERE OrganizationId = '{harbourview}'");

        Assert.Equal(HttpStatusCode.Created, (await _factory.CreateClient().PostAsJsonAsync($"/sign/learning-bond/{token}/acceptances", new { authority = true })).StatusCode);

        Assert.Equal(before, Rows($"SELECT Id FROM LearningBondAgreementAcceptances WHERE OrganizationId = '{harbourview}'"));
        Assert.Equal("0", Scalar($"SELECT COUNT(*) FROM AuditEntries WHERE OrganizationId = '{harbourview}' AND ActorName LIKE 'Signer:%'"));
        Assert.Equal("0", Scalar($"SELECT COUNT(*) FROM Notifications WHERE OrganizationId = '{harbourview}' AND Kind = 'agreement'"));
        Assert.DoesNotContain((await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray(),
            n => n.GetProperty("kind").GetString() == "agreement");
    }

    private static async Task AssertExpired(HttpClient anonymous, string token)
    {
        var read = await anonymous.GetAsync($"/sign/learning-bond/{token}");
        Assert.Equal(HttpStatusCode.Gone, read.StatusCode);
        Assert.Equal("This link has expired. Ask Northgate Community Church Kids to send a new one.",
            (await read.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString());
        Assert.Equal(HttpStatusCode.Gone, (await anonymous.PostAsJsonAsync($"/sign/learning-bond/{token}/acceptances", new { authority = true })).StatusCode);
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
