using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-146 intake asks once and only for what is missing: the record confirmed, the guardian's SIN, the child's SIN and last year's tax return;
// SINs validated on the server, kept only encrypted and shown as the last three digits (L2-159); reused for a second child.
public sealed class LearningBondIntakeTests : IAsyncLifetime
{
    private const string GuardianSin = "276 543 212";
    private const string MateoSin = "345-123-459";
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-146 criteria 1, 2 and 6, L2-159.
    [Fact]
    public async Task The_intake_confirms_the_record_asks_three_things_and_keeps_only_the_last_three_digits()
    {
        var carmen = await Consented(Mateo);

        var intake = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/intake"));
        Assert.Equal("Mateo Rivera", intake.GetProperty("childName").GetString());
        Assert.Equal("2017-03-14", intake.GetProperty("dateOfBirth").GetString());
        Assert.Equal(2025, intake.GetProperty("taxYear").GetInt32());
        Assert.Equal(JsonValueKind.Null, intake.GetProperty("guardianSin").ValueKind);
        Assert.Equal(JsonValueKind.Null, intake.GetProperty("childSin").ValueKind);
        Assert.Equal(JsonValueKind.Null, intake.GetProperty("taxFiled").ValueKind);

        Assert.Equal(HttpStatusCode.NoContent,
            (await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = GuardianSin, childSin = MateoSin, taxFiled = "Yes" })).StatusCode);

        var saved = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/intake"));
        Assert.Equal("212", saved.GetProperty("guardianSin").GetString());
        Assert.Equal("459", saved.GetProperty("childSin").GetString());
        Assert.Equal("Yes", saved.GetProperty("taxFiled").GetString());
        Assert.DoesNotContain("276543212", saved.ToString(), StringComparison.Ordinal);
        Assert.Equal("212|459", Scalar("SELECT i.GuardianSinLast3 || '|' || c.ChildSinLast3 FROM LearningBondIntakes i JOIN LearningBondClaims c ON c.HouseholdId = i.HouseholdId"));
        Assert.DoesNotContain("276543212", Scalar("SELECT GuardianSinCiphertext FROM LearningBondIntakes"), StringComparison.Ordinal);
        Assert.DoesNotContain("345123459", Scalar("SELECT ChildSinCiphertext FROM LearningBondClaims"), StringComparison.Ordinal);
        Assert.Equal("Guardian|Learning Bond intake saved for Mateo: guardian SIN, child SIN, tax return",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond intake saved%'"));
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM AuditEntries WHERE Summary LIKE '%276%543%212%' OR BeforeJson LIKE '%276543212%' OR AfterJson LIKE '%276543212%'"));
    }

    // L2-146 criteria 3 and 4.
    [Fact]
    public async Task A_number_that_is_not_a_SIN_and_the_same_SIN_twice_are_refused_and_nothing_is_stored()
    {
        var carmen = await Consented(Mateo);

        var bad = await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "123 456 789", childSin = "046 454 286", taxFiled = "Yes" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, bad.StatusCode);
        var errors = (await bad.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Check the number. A SIN has 9 digits, like 123 456 782.", errors.GetProperty("guardianSin").GetString());
        Assert.Equal("Check the number. A SIN has 9 digits, like 123 456 782.", errors.GetProperty("childSin").GetString());

        var same = await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = GuardianSin, childSin = "276543212", taxFiled = "Yes" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, same.StatusCode);
        Assert.Equal("Each person has their own SIN.", (await same.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("childSin").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondIntakes WHERE GuardianSinLast3 IS NOT NULL"));
    }

    // L2-146 criterion 5: a second child reuses the guardian's SIN and tax answer, shown masked.
    [Fact]
    public async Task A_second_child_reuses_the_guardians_SIN_and_tax_answer()
    {
        var carmen = await Consented(Mateo);
        await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = GuardianSin, childSin = MateoSin, taxFiled = "Yes" });
        Assert.Equal(HttpStatusCode.Forbidden, (await carmen.Http.GetAsync(carmen.Path($"/children/{Sofia}/intake"))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Sofia }, typedName = "Carmen Rivera" })).StatusCode);

        var sofia = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Sofia}/intake"));

        Assert.Equal("212", sofia.GetProperty("guardianSin").GetString());
        Assert.Equal("Yes", sofia.GetProperty("taxFiled").GetString());
        Assert.Equal(JsonValueKind.Null, sofia.GetProperty("childSin").ValueKind);
        Assert.Equal(HttpStatusCode.NoContent, (await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Sofia}/intake"), new { childSin = "193 456 787" })).StatusCode);
    }

    // L2-146 criterion 1: Fix this pauses the claim and tells the staff who see status.
    [Fact]
    public async Task Fix_this_pauses_the_claim_and_tells_staff_what_to_check()
    {
        var carmen = await Consented(Mateo);

        Assert.Equal(HttpStatusCode.NoContent, (await carmen.Http.PostAsJsonAsync(carmen.Path($"/children/{Mateo}/intake/record-fix"), new { note = "His birthday is March 15." })).StatusCode);

        Assert.Equal("Paused|AwaitingRecordFix", Scalar("SELECT Status || '|' || PausedReason FROM LearningBondClaims"));
        var notice = Assert.Single((await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray(),
            n => n.GetProperty("kind").GetString() == "learning-bond");
        Assert.Equal("The Rivera household asks to fix Mateo’s record for Learning Bond: “His birthday is March 15.”", notice.GetProperty("text").GetString());
        Assert.True((await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/intake"))).GetProperty("recordFixRequested").GetBoolean());
    }

    private async Task<LearningBondGuardianClient> Consented(Guid child)
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        Assert.Equal(HttpStatusCode.Created, (await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { child }, typedName = "Carmen Rivera" })).StatusCode);
        return carmen;
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
