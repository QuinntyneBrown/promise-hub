using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-122 criteria 1 to 5, L2-001, L2-007, L2-032
// Description: admins and program directors read and change their own organization's name, city, contact email, phone and time zone;
// each field is validated, the change is audited with the changed fields, and another organization never changes.
public sealed class OrganizationProfileTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_profile_answers_the_name_city_contact_phone_time_zone_and_no_logo()
    {
        var profile = await Profile(Tom);

        Assert.Equal("Harbourview Youth Collective", profile.GetProperty("name").GetString());
        Assert.Equal("Hamilton, Ontario", profile.GetProperty("city").GetString());
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("contactEmail").ValueKind);
        Assert.Equal("905-555-0100", profile.GetProperty("phone").GetString());
        Assert.Equal("America/Toronto", profile.GetProperty("timeZone").GetString());
        Assert.False(profile.GetProperty("hasLogo").GetBoolean());
    }

    [Fact]
    public async Task A_program_director_saves_the_profile_and_the_change_is_audited_with_the_changed_fields()
    {
        var saved = await Save(Marisol, "Harbourview Youth Collective", "Hamilton, Ontario", "hello@harbourview.example", "905-555-0111", "America/Halifax");

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var profile = await Profile(Tom);
        Assert.Equal("hello@harbourview.example", profile.GetProperty("contactEmail").GetString());
        Assert.Equal("905-555-0111", profile.GetProperty("phone").GetString());
        Assert.Equal("America/Halifax", profile.GetProperty("timeZone").GetString());
        var summary = Assert.Single(Query($"SELECT Summary FROM AuditEntries WHERE RecordType = 'Organization' AND Action = 'Updated' AND OrganizationId = '{Upper(DatabaseSeeder.Harbourview)}'"));
        Assert.Contains("contact email, phone, time zone", summary);
    }

    [Fact]
    public async Task A_new_name_shows_in_the_session_and_an_empty_contact_email_or_phone_clears_it()
    {
        await Save(Tom, "Harbourview Youth", "Hamilton, Ontario", "hello@harbourview.example", "905-555-0100", "America/Toronto");

        Assert.Equal(HttpStatusCode.NoContent, (await Save(Tom, "Harbourview Youth", "Hamilton, Ontario", "", null, "America/Toronto")).StatusCode);

        var profile = await Profile(Tom);
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("contactEmail").ValueKind);
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("phone").ValueKind);
        var me = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/me");
        Assert.Contains("Harbourview Youth", me.GetRawText());
    }

    [Fact]
    public async Task Every_field_is_validated_and_nothing_changes()
    {
        var invalid = await Save(Tom, " ", "", "hello@harbourview", "555-0100", "Europe/Paris");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter your organization’s name.", errors.GetProperty("name").GetString());
        Assert.Equal("Enter the city you work in.", errors.GetProperty("city").GetString());
        Assert.Equal("Enter an email like hello@example.org.", errors.GetProperty("contactEmail").GetString());
        Assert.Equal("Include the area code, like 905-555-0100.", errors.GetProperty("phone").GetString());
        Assert.Equal("Choose a time zone from the list.", errors.GetProperty("timeZone").GetString());
        var tooLong = await Save(Tom, new string('H', 101), new string('C', 101), null, null, "America/Toronto");
        var longErrors = (await tooLong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Use at most 100 characters.", longErrors.GetProperty("name").GetString());
        Assert.Equal("Use at most 100 characters.", longErrors.GetProperty("city").GetString());
        Assert.Equal("905-555-0100", (await Profile(Tom)).GetProperty("phone").GetString());
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Organization' AND Action = 'Updated'"));
    }

    [Fact]
    public async Task Only_admins_and_program_directors_read_or_save_the_profile()
    {
        foreach (var membership in new[] { Jaylen, Daniel, Sofia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(membership).GetAsync("/settings/organization/profile")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Save(membership, "Mine now", "Hamilton", null, null, "America/Toronto")).StatusCode);
        }
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync("/settings/organization/profile")).StatusCode);
    }

    [Fact]
    public async Task Another_organization_saves_its_own_profile_and_Harbourview_never_changes()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await Save(Grace, "Northgate Kids", "Burlington, Ontario", "office@northgate.example", "289-555-0191", "America/Winnipeg")).StatusCode);

        var harbourview = await Profile(Tom);
        Assert.Equal("Harbourview Youth Collective", harbourview.GetProperty("name").GetString());
        Assert.Equal("America/Toronto", harbourview.GetProperty("timeZone").GetString());
        Assert.Equal("Northgate Kids", (await Profile(Grace)).GetProperty("name").GetString());
        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'Organization' AND OrganizationId = '{Upper(DatabaseSeeder.Harbourview)}'"));
    }

    private async Task<JsonElement> Profile(Guid membership) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/settings/organization/profile");

    private Task<HttpResponseMessage> Save(Guid membership, string name, string city, string? contactEmail, string? phone, string timeZone) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/organization/profile", new { name, city, contactEmail, phone, timeZone });

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
