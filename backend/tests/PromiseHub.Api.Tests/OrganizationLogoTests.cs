using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-123 criteria 1 to 5, L2-001, L2-007, L2-031, L2-032
// Description: an admin uploads a PNG or JPEG logo of up to 1 MB, checked by its content and stored under the organization's key; a new
// one replaces the earlier file, removing deletes it, each is audited, and another organization never sees it.
public sealed class OrganizationLogoTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private static readonly byte[] Png = [0x89, (byte)'P', (byte)'N', (byte)'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, (byte)'I', (byte)'H', (byte)'D', (byte)'R', 1, 2, 3];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, (byte)'J', (byte)'F', (byte)'I', (byte)'F', 0, 1, 2, 3];
    private static readonly byte[] Pdf = "%PDF-1.7 harbourview flyer"u8.ToArray();
    private static readonly byte[] Svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"u8.ToArray();

    private readonly PromiseHubApiFactory _factory = new();

    private FakeFileStore Store => _factory.Services.GetRequiredService<FakeFileStore>();

    [Fact]
    public async Task A_png_is_stored_under_the_organization_served_back_and_audited()
    {
        var response = await Upload(Tom, "harbourview-logo.png", "image/png", Png);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var logo = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("harbourview-logo.png", logo.GetProperty("fileName").GetString());
        Assert.Equal("Tom Nguyen", logo.GetProperty("uploadedBy").GetString());
        var stored = Assert.Single(Store.Files);
        Assert.StartsWith($"logos/{DatabaseSeeder.Harbourview}/", stored.Key);
        Assert.EndsWith(".png", stored.Key);
        Assert.DoesNotContain("harbourview-logo", stored.Key);
        var served = await _factory.ClientFor(Tom).GetAsync("/settings/organization/logo");
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal("image/png", served.Content.Headers.ContentType?.MediaType);
        Assert.Equal(Png, await served.Content.ReadAsByteArrayAsync());
        var profile = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/organization/profile");
        Assert.True(profile.GetProperty("hasLogo").GetBoolean());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'OrganizationLogo'"), s => s.Contains("harbourview-logo.png"));
    }

    [Fact]
    public async Task A_jpeg_replaces_the_earlier_logo_and_its_file_is_deleted()
    {
        await Upload(Tom, "first.png", "image/png", Png);
        var first = Assert.Single(Store.Files).Key;

        Assert.Equal(HttpStatusCode.Created, (await Upload(Tom, "second.jpg", "image/jpeg", Jpeg)).StatusCode);

        var second = Assert.Single(Store.Files);
        Assert.NotEqual(first, second.Key);
        Assert.EndsWith(".jpg", second.Key);
        var served = await _factory.ClientFor(Tom).GetAsync("/settings/organization/logo");
        Assert.Equal("image/jpeg", served.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task A_file_that_is_not_a_png_or_jpeg_by_its_content_or_is_too_large_or_empty_is_refused()
    {
        var pdf = await Upload(Tom, "harbourview-flyer.pdf", "application/pdf", Pdf);
        var disguised = await Upload(Tom, "logo.png", "image/png", Pdf);
        var svg = await Upload(Tom, "logo.svg", "image/svg+xml", Svg);
        var empty = await Upload(Tom, "logo.png", "image/png", []);
        var large = await Upload(Tom, "logo.png", "image/png", [.. Png, .. new byte[1024 * 1024]]);

        foreach (var refused in new[] { pdf, disguised, svg, empty, large })
        {
            Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
            Assert.Equal("Choose a PNG or JPEG of up to 1 MB.",
                (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("file").GetString());
        }
        Assert.Empty(Store.Files);
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'OrganizationLogo'"));
    }

    [Fact]
    public async Task Removing_the_logo_deletes_the_file_and_is_audited_and_without_one_answers_404()
    {
        await Upload(Tom, "harbourview-logo.png", "image/png", Png);

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).DeleteAsync("/settings/organization/logo")).StatusCode);

        Assert.Empty(Store.Files);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/settings/organization/logo")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).DeleteAsync("/settings/organization/logo")).StatusCode);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'OrganizationLogo'"));
    }

    [Fact]
    public async Task Only_admins_and_program_directors_manage_the_logo_and_another_organization_never_sees_it()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Upload(Jaylen, "logo.png", "image/png", Png)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/organization/logo")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).DeleteAsync("/settings/organization/logo")).StatusCode);

        await Upload(Tom, "harbourview-logo.png", "image/png", Png);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync("/settings/organization/logo")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync("/settings/organization/logo")).StatusCode);
        Assert.Single(Store.Files);
    }

    private Task<HttpResponseMessage> Upload(Guid membership, string fileName, string contentType, byte[] bytes)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return _factory.ClientFor(membership).PostAsync("/settings/organization/logo", new MultipartFormDataContent { { file, "file", fileName } });
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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
