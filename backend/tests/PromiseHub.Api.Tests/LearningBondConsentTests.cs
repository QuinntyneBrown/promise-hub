using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-145 per-child consent for the financial module: one consent per ticked child with scope LearningBond, the typed name, the wording's
// version, the language and the time, audited; separate from every other consent. L2-162 module gate.
public sealed class LearningBondConsentTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-145 criteria 1, 2 and 4.
    [Fact]
    public async Task Ticking_Mateo_only_stores_one_LearningBond_consent_for_him_and_the_household_has_started()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        var programConsents = Scalar("SELECT COUNT(*) FROM GuardianConsents");

        var page = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path("/consent"));
        Assert.Equal(["Mateo", "Sofía"], page.GetProperty("children").EnumerateArray().Select(c => c.GetProperty("firstName").GetString()!));
        Assert.Equal("Acepto que Learning Bond recopile los números de seguro social de Mateo y míos y nuestra situación fiscal, y los envíe al proveedor de RESP que yo elija "
            + "y al Gobierno de Canadá para solicitar el Bono de Estudios Canadiense.", page.GetProperty("children")[0].GetProperty("wording").GetString());

        var response = await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal($"{Upper(Mateo)}|LearningBond|Carmen Rivera|1|es",
            Scalar("SELECT ChildId || '|' || Scope || '|' || TypedName || '|' || WordingVersion || '|' || Language FROM LearningBondConsents"));
        Assert.Equal("1", Scalar("SELECT COUNT(*) FROM LearningBondClaims WHERE Status = 'Started'"));
        Assert.Equal(programConsents, Scalar("SELECT COUNT(*) FROM GuardianConsents"));
        Assert.Equal("Guardian|Learning Bond consent given for Mateo by Carmen Rivera",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond consent given%'"));
        Assert.Equal("Started", (await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path("/page"))).GetProperty("status").GetString());
        var rivera = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == "Rivera");
        Assert.Equal("Started", rivera.GetProperty("status").GetString());

        var again = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path("/consent"));
        Assert.Equal(["Sofía"], again.GetProperty("children").EnumerateArray().Select(c => c.GetProperty("firstName").GetString()!));
    }

    // L2-145 criterion 3.
    [Fact]
    public async Task No_child_ticked_and_no_name_typed_are_refused_and_nothing_is_stored()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");

        var response = await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = Array.Empty<Guid>(), typedName = " " });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Tick at least one child.", errors.GetProperty("children").GetString());
        Assert.Equal("Type your full name to sign.", errors.GetProperty("typedName").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondConsents"));
    }

    // L2-145 criterion 5: a child who isn't this household's is refused; a name that isn't a guardian's is refused.
    [Fact]
    public async Task Another_households_child_is_forbidden_and_a_name_that_is_not_a_guardians_is_refused()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");

        Assert.Equal(HttpStatusCode.Forbidden, (await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Kevin }, typedName = "Carmen Rivera" })).StatusCode);
        var stranger = await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Sofia }, typedName = "Someone Else" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, stranger.StatusCode);
        Assert.Equal("Type the full name of a guardian of this household.",
            (await stranger.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("typedName").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondConsents"));
    }

    // L2-162: an unverified device gets the code step; with the module off the consent is unknown.
    [Fact]
    public async Task An_unverified_device_gets_the_code_step_and_the_module_off_answers_404()
    {
        var guardian = new LearningBondGuardianClient(_factory);
        var token = await guardian.LinkAsync(DatabaseSeeder.Harbourview, "Rivera");
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await guardian.Http.PostAsJsonAsync($"/g/learning-bond/{token}/consents", new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" })).StatusCode);
        var northgate = await guardian.LinkAsync(DatabaseSeeder.Northgate, "Rivera");
        Assert.Equal(HttpStatusCode.NotFound, (await guardian.Http.GetAsync($"/g/learning-bond/{northgate}/consent")).StatusCode);
    }

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

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
