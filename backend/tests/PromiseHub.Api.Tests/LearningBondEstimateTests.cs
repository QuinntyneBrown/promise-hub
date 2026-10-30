using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-147 the estimate is one number from a versioned rule on the server, never the language model: $500 and $100 a year to 15, capped at
// $2,000; nothing before 2004; with no tax return filed the claim pauses (L2-151).
public sealed class LearningBondEstimateTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-147 criteria 1 and 5.
    [Fact]
    public async Task Mateo_born_in_2017_may_be_owed_up_to_1400_and_the_claim_records_the_rule_version()
    {
        var carmen = await Intake("Yes");

        var estimate = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/estimate"));

        Assert.Equal(1400, estimate.GetProperty("amount").GetInt32());
        Assert.Equal(1, estimate.GetProperty("ruleVersion").GetInt32());
        Assert.False(estimate.GetProperty("bornBefore2004").GetBoolean());
        Assert.False(estimate.GetProperty("needsTaxReturn").GetBoolean());
        Assert.Equal("Mateo", estimate.GetProperty("firstName").GetString());
        Assert.Equal("1400|1|Started", Scalar("SELECT EstimateAmount || '|' || RuleVersion || '|' || Status FROM LearningBondClaims"));
    }

    // L2-147 criteria 2 and 3.
    [Theory]
    [InlineData("2011-06-01", 2000)]
    [InlineData("2026-01-15", 500)]
    public async Task The_estimate_is_capped_and_starts_at_500(string born, int amount)
    {
        var carmen = await Intake("Yes");
        Execute($"UPDATE Children SET DateOfBirth = '{born}' WHERE Id = '{Mateo.ToString().ToUpperInvariant()}'");

        Assert.Equal(amount, (await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/estimate"))).GetProperty("amount").GetInt32());
    }

    [Fact]
    public async Task A_child_born_before_2004_has_no_Learning_Bond()
    {
        var carmen = await Intake("Yes");
        Execute($"UPDATE Children SET DateOfBirth = '2003-12-31' WHERE Id = '{Mateo.ToString().ToUpperInvariant()}'");

        var estimate = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/estimate"));

        Assert.True(estimate.GetProperty("bornBefore2004").GetBoolean());
        Assert.Equal(JsonValueKind.Null, estimate.GetProperty("amount").ValueKind);
    }

    // L2-147 criterion 4, L2-151: with no tax return filed the claim pauses until one is.
    [Fact]
    public async Task With_no_tax_return_filed_the_estimate_says_so_and_the_claim_pauses()
    {
        var carmen = await Intake("No");

        var estimate = await carmen.Http.GetFromJsonAsync<JsonElement>(carmen.Path($"/children/{Mateo}/estimate"));

        Assert.True(estimate.GetProperty("needsTaxReturn").GetBoolean());
        Assert.Equal(1400, estimate.GetProperty("amount").GetInt32());
        Assert.Equal("Paused|NeedsTaxReturn", Scalar("SELECT Status || '|' || PausedReason FROM LearningBondClaims"));
        var rivera = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == "Rivera");
        Assert.Equal("PausedNeedsTaxReturn", rivera.GetProperty("status").GetString());
    }

    // L2-147: no estimate before the intake is complete.
    [Fact]
    public async Task Before_the_intake_is_complete_the_estimate_answers_409()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });

        var response = await carmen.Http.GetAsync(carmen.Path($"/children/{Mateo}/estimate"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Contains("intake-incomplete", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    private async Task<LearningBondGuardianClient> Intake(string taxFiled)
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
        Assert.Equal(HttpStatusCode.NoContent,
            (await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled })).StatusCode);
        return carmen;
    }

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
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
