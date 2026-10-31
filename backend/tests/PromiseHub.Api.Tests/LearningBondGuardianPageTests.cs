using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-144 the invitation opens the guardian's Learning Bond page: the device code first, then each covered child under 18 with the amount
// they may be owed, the agent's fixed explanation in the household's language, Not now and I'm not interested; L2-162 module gate.
public sealed partial class LearningBondGuardianPageTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    // L2-144 criteria 1 to 3.
    [Fact]
    public async Task A_verified_device_sees_each_covered_child_with_an_amount_and_the_fixed_explanation_in_Spanish()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Rivera");
        var unverified = await _guardian.GetAsync($"/g/learning-bond/{token}/page");
        Assert.Equal(HttpStatusCode.Unauthorized, unverified.StatusCode);
        var body = await unverified.Content.ReadAsStringAsync();
        Assert.Contains("verification-required", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Mateo", body, StringComparison.Ordinal);

        await Verify(token, "905-555-0142");
        var page = await _guardian.GetFromJsonAsync<JsonElement>($"/g/learning-bond/{token}/page");

        Assert.Equal("es", page.GetProperty("language").GetString());
        Assert.Equal("Harbourview Youth Collective", page.GetProperty("organization").GetString());
        Assert.Equal("El Bono de Estudios Canadiense es dinero que el Gobierno de Canadá deposita en el RESP de un niño para familias con ingresos más bajos. "
            + "No tiene que aportar dinero. Lo que escriba va al proveedor del RESP y al Gobierno de Canadá, no a Harbourview Youth Collective.",
            page.GetProperty("explanation").GetString());
        var children = page.GetProperty("children").EnumerateArray().ToList();
        Assert.Equal(["Mateo", "Sofía"], children.Select(c => c.GetProperty("firstName").GetString()!));
        Assert.Equal([1400, 1700], children.Select(c => c.GetProperty("amount").GetInt32()));
        Assert.Equal([9, 12], children.Select(c => c.GetProperty("age").GetInt32()));
        Assert.All(children, c => Assert.False(c.GetProperty("selfClaim").GetBoolean()));
        Assert.Equal("Invited", page.GetProperty("status").GetString());
    }

    // L2-144 criterion 6: a child aged 18 to 20 is named with the self-claim rule and no amount.
    [Fact]
    public async Task A_child_aged_18_to_20_is_named_with_the_self_claim_rule_and_no_claim()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Haddad");
        await Verify(token, "905-555-0128");

        var children = (await _guardian.GetFromJsonAsync<JsonElement>($"/g/learning-bond/{token}/page")).GetProperty("children").EnumerateArray().ToList();

        Assert.Equal(["Nadia", "Yusuf"], children.Select(c => c.GetProperty("firstName").GetString()!));
        var nadia = children[0];
        Assert.True(nadia.GetProperty("selfClaim").GetBoolean());
        Assert.Equal(JsonValueKind.Null, nadia.GetProperty("amount").ValueKind);
        Assert.Equal(1800, children[1].GetProperty("amount").GetInt32());
    }

    // L2-144 criterion 4: Not now changes nothing; I'm not interested makes the household Not interested, audited.
    [Fact]
    public async Task Not_now_changes_nothing_and_not_interested_is_recorded_for_staff()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Rivera");
        await Verify(token, "905-555-0142");

        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync($"/g/learning-bond/{token}/choice", new { choice = "NotNow" })).StatusCode);
        Assert.Equal("Invited", await Status("Rivera"));

        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync($"/g/learning-bond/{token}/choice", new { choice = "NotInterested" })).StatusCode);
        Assert.Equal("NotInterested", await Status("Rivera"));
        Assert.Equal("NotInterested", (await _guardian.GetFromJsonAsync<JsonElement>($"/g/learning-bond/{token}/page")).GetProperty("status").GetString());
        Assert.Equal("Guardian|The Rivera household isn’t interested in the Learning Bond",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE '%interested in the Learning Bond'"));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _guardian.PostAsJsonAsync($"/g/learning-bond/{token}/choice", new { choice = "Maybe" })).StatusCode);
    }

    // L2-144 criterion 5, L2-162: an unknown link has expired; with the module off the page is unknown.
    [Fact]
    public async Task An_unknown_link_has_expired_and_the_module_off_answers_404()
    {
        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync("/g/learning-bond/not-a-link/page")).StatusCode);
        var northgate = await Link(DatabaseSeeder.Northgate, "Rivera");
        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.GetAsync($"/g/learning-bond/{northgate}/page")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.PostAsJsonAsync($"/g/learning-bond/{northgate}/choice", new { choice = "NotInterested" })).StatusCode);
    }

    private async Task<string> Status(string household) =>
        (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == household).GetProperty("status").GetString()!;

    // The household was invited at the door, as staff would, then the link it would carry is issued.
    private async Task<string> Link(Guid organizationId, string household)
    {
        if (organizationId == DatabaseSeeder.Harbourview)
        {
            await _factory.ClientFor(Tom).PostAsync($"/learning-bond/households/{DatabaseSeeder.HouseholdId(organizationId, household)}/invitations", null);
        }
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueLearningBond(DatabaseSeeder.HouseholdId(organizationId, household));
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private async Task Verify(string token, string contact)
    {
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact });
        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code = LastCode() })).StatusCode);
    }

    private string LastCode() => CodePattern().Match(_factory.Services.GetRequiredService<FakeSmsSender>().Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public Task InitializeAsync()
    {
        _guardian = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
