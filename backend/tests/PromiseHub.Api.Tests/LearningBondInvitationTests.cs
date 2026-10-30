using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-139 the invitation is platform text in English, Spanish and French, previewed in the organization's languages, and only a validated
// sender name is edited; L2-136 criteria 4 and 9 the Learning Bond hub, and a new agreement version disables Launch; L2-162 per organization.
public sealed class LearningBondInvitationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-139 criteria 1 and 5: Harbourview's households use English, Spanish and French; the sender defaults to the organization's name.
    [Fact]
    public async Task The_preview_is_in_each_language_the_households_use_with_the_sender_the_platform_wording_and_the_segment_count()
    {
        var invitation = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/invitation");

        Assert.Equal("Harbourview Youth Collective", invitation.GetProperty("senderName").GetString());
        var languages = invitation.GetProperty("languages").EnumerateArray().ToList();
        Assert.Equal(["en", "es", "fr"], languages.Select(l => l.GetProperty("code").GetString()));
        var english = languages[0];
        Assert.Equal("English", english.GetProperty("name").GetString());
        var sms = english.GetProperty("sms").GetString()!;
        Assert.StartsWith("Harbourview Youth Collective: ", sms, StringComparison.Ordinal);
        Assert.Contains("may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: ", sms, StringComparison.Ordinal);
        Assert.Equal(sms.Length, english.GetProperty("smsCharacters").GetInt32());
        Assert.Equal(sms.Length <= 160 ? 1 : 2, english.GetProperty("smsSegments").GetInt32());
        Assert.StartsWith("Harbourview Youth Collective via PromiseHub", english.GetProperty("emailFooter").GetString(), StringComparison.Ordinal);
        Assert.Contains("podría tener derecho a hasta $2,000", languages[1].GetProperty("sms").GetString(), StringComparison.Ordinal);
        Assert.Equal("Comprobar ahora", languages[1].GetProperty("emailAction").GetString());
    }

    // L2-139 criteria 1 and 6: only the languages the caller's own households use; Northgate's one household speaks Spanish.
    [Fact]
    public async Task Northgate_previews_only_Spanish_with_its_own_name_as_sender()
    {
        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await grace.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "LearningBond" } })).StatusCode);

        var invitation = await grace.GetFromJsonAsync<JsonElement>("/learning-bond/invitation");

        Assert.Equal("Northgate Community Church", invitation.GetProperty("senderName").GetString());
        var spanish = Assert.Single(invitation.GetProperty("languages").EnumerateArray());
        Assert.Equal("es", spanish.GetProperty("code").GetString());
        Assert.StartsWith("Northgate Community Church: ", spanish.GetProperty("sms").GetString(), StringComparison.Ordinal);
    }

    // L2-139 criterion 2.
    [Fact]
    public async Task Saving_a_sender_name_answers_204_every_preview_shows_it_and_it_is_audited()
    {
        var tom = _factory.ClientFor(Tom);

        var response = await tom.PutAsJsonAsync("/learning-bond/invitation", new { senderName = "Harbourview After-School" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var invitation = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/invitation");
        Assert.Equal("Harbourview After-School", invitation.GetProperty("senderName").GetString());
        Assert.All(invitation.GetProperty("languages").EnumerateArray(), l => Assert.StartsWith("Harbourview After-School", l.GetProperty("sms").GetString(), StringComparison.Ordinal));
        Assert.Equal("Tom Nguyen|Learning Bond settings changed: SenderName",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'LearningBondSettings'"));
    }

    // L2-139 criterion 3.
    [Theory]
    [InlineData("")]
    [InlineData("Harbourview Youth Collective After-School")]
    [InlineData("Harbourview hbv.ph/join")]
    [InlineData("Visit harbourview.ca")]
    [InlineData("Call 905-555-0142")]
    [InlineData("Harbourview <3")]
    public async Task A_sender_name_that_is_empty_too_long_a_link_a_phone_number_or_other_characters_is_refused(string senderName)
    {
        var response = await _factory.ClientFor(Tom).PutAsJsonAsync("/learning-bond/invitation", new { senderName });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("Use 1 to 30 letters, numbers and spaces.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("senderName").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondSettings"));
    }

    // L2-139 criterion 6, L2-162.
    [Fact]
    public async Task Northgate_gets_404_while_off_and_a_site_lead_gets_403()
    {
        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/invitation")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.PutAsJsonAsync("/learning-bond/invitation", new { senderName = "Northgate" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/overview")).StatusCode);

        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/invitation")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.PutAsJsonAsync("/learning-bond/invitation", new { senderName = "Jaylen" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/overview")).StatusCode);
    }

    // L2-136 criterion 9: the hub's summary of the agreement, coverage and invitation; counts only.
    [Fact]
    public async Task The_overview_answers_the_acceptance_coverage_roles_sender_and_languages_and_Launch_is_open()
    {
        var tom = _factory.ClientFor(Tom);
        await tom.PutAsJsonAsync("/learning-bond/settings", new { coverage = "ChosenPrograms", programIds = new[] { DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring") }, statusRoles = new[] { "SiteLead" } });

        var overview = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/overview");

        Assert.Equal(2, overview.GetProperty("agreementVersion").GetInt32());
        Assert.Equal("Tom Nguyen", overview.GetProperty("acceptance").GetProperty("acceptedBy").GetString());
        Assert.Equal(JsonValueKind.Null, overview.GetProperty("pendingVersion").ValueKind);
        Assert.Equal("ChosenPrograms", overview.GetProperty("coverage").GetString());
        Assert.Equal(["After-School Tutoring"], overview.GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
        Assert.Equal(3, overview.GetProperty("households").GetInt32());
        Assert.Equal(["Admin", "ProgramDirector", "SiteLead"], overview.GetProperty("statusRoles").EnumerateArray().Select(r => r.GetString()));
        Assert.Equal("Harbourview Youth Collective", overview.GetProperty("senderName").GetString());
        Assert.Equal(["en", "es", "fr"], overview.GetProperty("languages").EnumerateArray().Select(l => l.GetString()));
        Assert.Equal(JsonValueKind.Null, overview.GetProperty("launchBlocked").ValueKind);
    }

    // L2-136 criterion 4: a new platform version keeps the module on and disables Launch until it is accepted.
    [Fact]
    public async Task A_new_agreement_version_keeps_the_module_on_and_blocks_launch_until_it_is_accepted()
    {
        await PublishVersion(3);
        var tom = _factory.ClientFor(Tom);

        var overview = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/overview");
        Assert.Equal(3, overview.GetProperty("pendingVersion").GetInt32());
        Assert.Equal(2, overview.GetProperty("acceptance").GetProperty("version").GetInt32());
        Assert.Equal("A new version of the agreement needs accepting.", overview.GetProperty("launchBlocked").GetString());
        var agreement = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/agreement");
        Assert.Equal(JsonValueKind.Null, agreement.GetProperty("acceptance").ValueKind);
        Assert.Equal(2, agreement.GetProperty("earlierAcceptance").GetProperty("version").GetInt32());
        Assert.True(agreement.GetProperty("moduleOn").GetBoolean());

        Assert.Equal(HttpStatusCode.Created, (await tom.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);

        overview = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/overview");
        Assert.Equal(JsonValueKind.Null, overview.GetProperty("pendingVersion").ValueKind);
        Assert.Equal(JsonValueKind.Null, overview.GetProperty("launchBlocked").ValueKind);
    }

    private async Task PublishVersion(int version)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IPromiseHubDb>();
        db.LearningBondAgreements.Add(new LearningBondAgreement(Guid.NewGuid(), version, new DateOnly(2026, 11, 1), "What we collect, version 3.", "Where it goes, version 3.", "What your organization sees, version 3."));
        await db.SaveChangesAsync();
    }

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
