using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-126 criteria 1 to 4, L2-005, L2-007, L2-001, L2-032
// Description: while Public website is on, admins edit the website address, tagline, about and public email; the address is unique across
// organizations; the public site answers the new profile at the new address only.
public sealed class WebsiteProfileTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private const string Tagline = "Tutoring, sports and mentoring for Hamilton kids, after school and on Saturdays.";
    private const string About = "Harbourview Youth Collective runs free after-school tutoring, Saturday sports and one-to-one mentoring.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task With_Public_website_on_the_card_reads_the_address_and_an_empty_profile()
    {
        await TurnOnWebsite(Tom);

        var profile = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/website");

        Assert.Equal("harbourview", profile.GetProperty("slug").GetString());
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("tagline").ValueKind);
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("about").ValueKind);
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("contactEmail").ValueKind);
    }

    [Fact]
    public async Task Saving_moves_the_site_to_the_new_address_with_the_new_profile_and_is_audited()
    {
        await TurnOnWebsite(Tom);

        var saved = await Save(Tom, "harbourview-youth", Tagline, About, "Hello@Harbourview.example");

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var visitor = _factory.CreateClient();
        var site = await visitor.GetFromJsonAsync<JsonElement>("/website/harbourview-youth");
        Assert.Equal("Harbourview Youth Collective", site.GetProperty("name").GetString());
        Assert.Equal(Tagline, site.GetProperty("tagline").GetString());
        Assert.Equal(About, site.GetProperty("about").GetString());
        Assert.Equal("hello@harbourview.example", site.GetProperty("email").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/website/harbourview")).StatusCode);
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Organization' AND Action = 'Updated'"), s => s.Contains("Website profile"));
    }

    [Fact]
    public async Task Each_field_is_validated_and_nothing_changes()
    {
        await TurnOnWebsite(Tom);

        var invalid = await Save(Tom, "Harbourview Youth", "", new string('a', 1001), "hello@harbourview");
        var longTagline = await Save(Tom, "hv", new string('t', 121), null, null);

        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        Assert.Equal("Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.", errors.GetProperty("slug").GetString());
        Assert.Equal("Write a tagline of up to 120 characters.", errors.GetProperty("tagline").GetString());
        Assert.Equal("Use at most 1,000 characters.", errors.GetProperty("about").GetString());
        Assert.Equal("Enter an email like hello@example.org.", errors.GetProperty("contactEmail").GetString());
        var longErrors = (await longTagline.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.", longErrors.GetProperty("slug").GetString());
        Assert.Equal("Write a tagline of up to 120 characters.", longErrors.GetProperty("tagline").GetString());
        Assert.Equal("harbourview", (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/website")).GetProperty("slug").GetString());
    }

    [Fact]
    public async Task An_address_another_organization_uses_is_refused_without_revealing_it()
    {
        await TurnOnWebsite(Tom);

        var taken = await Save(Tom, "northgate", Tagline, null, null);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, taken.StatusCode);
        var body = await taken.Content.ReadAsStringAsync();
        Assert.Contains("Another organization uses this address. Choose another.", body);
        Assert.DoesNotContain("Northgate", body);
        Assert.Equal(HttpStatusCode.NoContent, (await Save(Tom, "harbourview", Tagline, null, null)).StatusCode);
    }

    [Fact]
    public async Task With_Public_website_off_both_answer_404_and_other_roles_get_403()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/settings/website")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Tom, "harbourview-youth", Tagline, null, null)).StatusCode);

        await TurnOnWebsite(Tom);

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/website")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Jaylen, "harbourview-youth", Tagline, null, null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync("/settings/website")).StatusCode);
    }

    private async Task TurnOnWebsite(Guid admin)
    {
        var on = (await _factory.ClientFor(admin).GetFromJsonAsync<JsonElement>("/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).Append("PublicWebsite").ToArray();
        Assert.True((await _factory.ClientFor(admin).PutAsJsonAsync("/settings/modules", new { on })).IsSuccessStatusCode);
    }

    private Task<HttpResponseMessage> Save(Guid membership, string slug, string tagline, string? about, string? contactEmail) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/website", new { slug, tagline, about, contactEmail });

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
