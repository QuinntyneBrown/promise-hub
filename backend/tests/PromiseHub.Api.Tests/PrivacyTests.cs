using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;
using PromiseHub.Infrastructure.Privacy;

namespace PromiseHub.Api.Tests;

// L2-030 privacy settings and data residency, L2-034 jobs per tenant, L2-007 roles, L2-001 tenant isolation, L2-032 audit.
public sealed class PrivacyTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_organization_shows_its_region_and_the_default_retention()
    {
        var privacy = await Get(Tom);

        Assert.Equal("Canada (Toronto region)", privacy.GetProperty("region").GetString());
        Assert.Equal(7, privacy.GetProperty("consentRetentionYears").GetInt32());
    }

    [Fact]
    public async Task Saving_retention_is_audited_and_an_unknown_period_is_refused()
    {
        var saved = await Save(Tom, 3);
        var refused = await Save(Tom, 5);

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal(3, (await Get(Tom)).GetProperty("consentRetentionYears").GetInt32());
        Assert.NotEmpty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'PrivacySettings'"));
    }

    [Fact]
    public async Task The_retention_job_removes_signature_details_past_the_period_and_keeps_the_count()
    {
        var signature = SeedSignature();
        await Save(Tom, 3);

        _factory.Clock.Advance(TimeSpan.FromDays(365 * 2));
        await Retention();
        Assert.Equal("Carmen Rivera", Query($"SELECT SignedBy FROM SlipSignatures WHERE Id = '{signature}'").Single());

        _factory.Clock.Advance(TimeSpan.FromDays(365 * 2));
        await Retention();
        Assert.Equal("Removed after 3 years", Query($"SELECT SignedBy FROM SlipSignatures WHERE Id = '{signature}'").Single());
        Assert.Equal("Signed", Query($"SELECT Status FROM SlipSignatures WHERE Id = '{signature}'").Single());
    }

    [Fact]
    public async Task Until_deleted_by_request_keeps_signatures()
    {
        var signature = SeedSignature();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/privacy", new { consentRetentionYears = (int?)null });

        _factory.Clock.Advance(TimeSpan.FromDays(365 * 10));
        await Retention();

        Assert.Equal("Carmen Rivera", Query($"SELECT SignedBy FROM SlipSignatures WHERE Id = '{signature}'").Single());
    }

    [Fact]
    public async Task Only_settings_managers_see_privacy_and_each_organization_keeps_its_own()
    {
        await Save(Tom, 3);

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/privacy")).StatusCode);
        Assert.Equal(7, (await Get(Grace)).GetProperty("consentRetentionYears").GetInt32());
    }

    private string SeedSignature()
    {
        var slip = Query($"SELECT Id FROM PermissionSlips WHERE EventId = '{FieldTrip.ToString().ToUpperInvariant()}'").Single();
        var id = Guid.NewGuid().ToString().ToUpperInvariant();
        Execute($"INSERT INTO SlipSignatures (Id, OrganizationId, SlipId, ChildId, Version, Status, SignedBy, At, Device, Language, TextHash, Answers, Reason) " +
                $"VALUES ('{id}', '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}', '{slip}', '{Mateo.ToString().ToUpperInvariant()}', 1, 'Signed', 'Carmen Rivera', {new DateTimeOffset(2026, 11, 3, 20, 0, 0, TimeSpan.Zero).UtcTicks}, 'Phone', 'Spanish', 'abc', '{{}}', NULL)");
        return id;
    }

    private Task Retention() => _factory.Services.GetRequiredService<RetentionRunner>().RunOnceAsync();

    private async Task<JsonElement> Get(Guid membership) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/settings/privacy");

    private Task<HttpResponseMessage> Save(Guid membership, int years) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/privacy", new { consentRetentionYears = years });

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
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
