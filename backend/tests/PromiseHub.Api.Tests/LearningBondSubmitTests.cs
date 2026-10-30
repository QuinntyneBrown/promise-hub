using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-149 nothing leaves before the guardian taps Submit: sent once through the provider's channel with the review's version, audited without a
// SIN; a stale version is refused; a provider that fails leaves it ready to submit and a retry sends it once.
public sealed class LearningBondSubmitTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();

    private FakeRespProviderChannel Channel => _factory.Services.GetRequiredService<FakeRespProviderChannel>();

    // L2-149 criteria 1 to 3.
    [Fact]
    public async Task Submit_sends_the_application_once_and_nothing_leaves_before_it()
    {
        var (carmen, id, version) = await Ready();
        Assert.Empty(Channel.Submissions);

        var response = await carmen.Http.PostAsJsonAsync(carmen.Path($"/applications/{id}/submit"), new { reviewVersion = version });
        var again = await carmen.Http.PostAsJsonAsync(carmen.Path($"/applications/{id}/submit"), new { reviewVersion = version });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, again.StatusCode);
        Assert.Equal("Submitted", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        var sent = Assert.Single(Channel.Submissions);
        Assert.Equal("Northfield Credit Union", sent.Provider);
        Assert.Equal("Mateo Rivera", sent.BeneficiaryName);
        Assert.Equal("345123459", sent.ChildSin);
        Assert.Equal("276543212", sent.GuardianSin);
        Assert.Equal("Submitted|Submitted", Scalar("SELECT a.Status || '|' || c.Status FROM LearningBondApplications a JOIN LearningBondClaims c ON c.Id = a.ClaimId"));
        Assert.Equal("Guardian|Learning Bond application for Mateo submitted to Northfield Credit Union",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Submitted' AND RecordType = 'LearningBondApplication'"));
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM AuditEntries WHERE Summary LIKE '%345123459%' OR AfterJson LIKE '%345123459%' OR Summary LIKE '%276543212%'"));
        var rivera = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == "Rivera");
        Assert.Equal("Submitted", rivera.GetProperty("status").GetString());
    }

    // L2-149 criterion 4: an old review version, or an application not yet complete, sends nothing.
    [Fact]
    public async Task A_stale_review_version_or_a_missing_address_answers_409_and_sends_nothing()
    {
        var (carmen, id, version) = await Ready();

        Assert.Equal(HttpStatusCode.Conflict, (await carmen.Http.PostAsJsonAsync(carmen.Path($"/applications/{id}/submit"), new { reviewVersion = version - 1 })).StatusCode);
        Assert.Empty(Channel.Submissions);
    }

    // L2-149 criterion 5.
    [Fact]
    public async Task A_provider_that_fails_leaves_it_ready_to_submit_and_a_retry_sends_it_once()
    {
        var (carmen, id, version) = await Ready();
        Channel.Fail = true;

        var failed = await carmen.Http.PostAsJsonAsync(carmen.Path($"/applications/{id}/submit"), new { reviewVersion = version });

        Assert.Equal(HttpStatusCode.BadGateway, failed.StatusCode);
        Assert.Contains("not-sent", await failed.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.Equal("ReadyToSubmit", Scalar("SELECT Status FROM LearningBondApplications"));
        Channel.Fail = false;
        Assert.Equal(HttpStatusCode.Accepted, (await carmen.Http.PostAsJsonAsync(carmen.Path($"/applications/{id}/submit"), new { reviewVersion = version })).StatusCode);
        Assert.Single(Channel.Submissions);
    }

    private async Task<(LearningBondGuardianClient Carmen, string Id, int Version)> Ready()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
        await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled = "Yes" });
        await carmen.Http.GetAsync(carmen.Path($"/children/{Mateo}/estimate"));
        var prepared = await (await carmen.Http.PostAsync(carmen.Path($"/children/{Mateo}/applications"), null)).Content.ReadFromJsonAsync<JsonElement>();
        var id = prepared.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.Conflict, (await carmen.Http.PostAsJsonAsync(carmen.Path($"/applications/{id}/submit"),
            new { reviewVersion = prepared.GetProperty("reviewVersion").GetInt32() })).StatusCode);
        var withAddress = await (await carmen.Http.PatchAsJsonAsync(carmen.Path($"/applications/{id}/fields/address"), new { value = "42 Barton St E, Hamilton ON L8L 2V6" }))
            .Content.ReadFromJsonAsync<JsonElement>();
        return (carmen, id, withAddress.GetProperty("reviewVersion").GetInt32());
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
