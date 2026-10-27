using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-067 criteria 7 to 9 (a lesson video through file storage), L2-031 (uploads validated by type, size and content).
public sealed class LessonVideoTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private static readonly byte[] Mp4 = [0, 0, 0, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', (byte)'i', (byte)'s', (byte)'o', (byte)'m', 1, 2, 3, 4, 5, 6, 7, 8];
    private static readonly byte[] Mov = [0, 0, 0, 0x14, (byte)'f', (byte)'t', (byte)'y', (byte)'p', (byte)'q', (byte)'t', (byte)' ', (byte)' ', 9, 9, 9, 9];
    private static readonly byte[] WebM = [0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81, 1, 2, 3];
    private static readonly byte[] Pdf = "%PDF-1.7 weekly schedule"u8.ToArray();

    private readonly PromiseHubApiFactory _factory = new();

    private FakeFileStore Store => _factory.Services.GetRequiredService<FakeFileStore>();

    [Fact]
    public async Task An_mp4_is_stored_under_the_organization_and_lesson_recorded_on_the_lesson_and_audited()
    {
        var lesson = await Lesson();

        var response = await Upload(Marisol, lesson, "pick-up-the-towel.mp4", "video/mp4", Mp4);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var video = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("pick-up-the-towel.mp4", video.GetProperty("fileName").GetString());
        Assert.Equal(Mp4.Length, video.GetProperty("bytes").GetInt64());
        Assert.Equal("Marisol Delgado", video.GetProperty("uploadedBy").GetString());
        var stored = Assert.Single(Store.Files);
        Assert.StartsWith($"lessons/{DatabaseSeeder.Harbourview}/{lesson}/", stored.Key);
        Assert.EndsWith(".mp4", stored.Key);
        Assert.DoesNotContain("pick-up", stored.Key);
        Assert.Equal(Mp4, stored.Value);
        var read = await Get(Marisol, $"/curriculum/lessons/{lesson}");
        Assert.Equal("pick-up-the-towel.mp4", read.GetProperty("video").GetProperty("fileName").GetString());
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'LessonVideo'"), s => s.Contains("pick-up-the-towel.mp4"));
    }

    [Fact]
    public async Task MOV_and_WebM_videos_are_accepted_and_a_new_video_replaces_and_removes_the_earlier_one()
    {
        var lesson = await Lesson();

        Assert.Equal(HttpStatusCode.Created, (await Upload(Marisol, lesson, "first.mov", "video/quicktime", Mov)).StatusCode);
        var first = Assert.Single(Store.Files).Key;
        Assert.Equal(HttpStatusCode.Created, (await Upload(Marisol, lesson, "second.webm", "video/webm", WebM)).StatusCode);

        var second = Assert.Single(Store.Files).Key;
        Assert.NotEqual(first, second);
        Assert.EndsWith(".webm", second);
        Assert.Equal("second.webm", (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("video").GetProperty("fileName").GetString());
    }

    [Fact]
    public async Task A_file_that_is_not_a_video_is_refused_and_nothing_is_stored()
    {
        var lesson = await Lesson();
        const string message = "Choose an MP4, MOV or WebM video of up to 1 GB.";

        Assert.Equal(message, await Error(await Upload(Marisol, lesson, "weekly-schedule.pdf", "application/pdf", Pdf)));
        Assert.Equal(message, await Error(await Upload(Marisol, lesson, "renamed.mp4", "video/mp4", Pdf)));
        Assert.Equal(message, await Error(await Upload(Marisol, lesson, "clip.mp4", "text/html", Mp4)));
        Assert.Equal(message, await Error(await Upload(Marisol, lesson, "clip.exe", "video/mp4", Mp4)));
        Assert.Equal(message, await Error(await Upload(Marisol, lesson, "empty.mp4", "video/mp4", [])));
        var noFile = await _factory.ClientFor(Marisol).PostAsync($"/curriculum/lessons/{lesson}/video", new MultipartFormDataContent());
        Assert.Equal(message, await Error(noFile));
        Assert.Empty(Store.Files);
        Assert.Equal(JsonValueKind.Null, (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("video").ValueKind);
    }

    [Fact]
    public async Task A_video_over_the_configured_limit_is_refused()
    {
        await using var small = _factory.WithWebHostBuilder(b => b.UseSetting("Lessons:MaxVideoBytes", "10"));
        var lesson = await Lesson();
        var client = small.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName, Marisol.ToString());

        var response = await client.PostAsync($"/curriculum/lessons/{lesson}/video", Form("big.mp4", "video/mp4", Mp4));

        Assert.Equal("Choose an MP4, MOV or WebM video of up to 1 GB.", await Error(response));
        Assert.Empty(Store.Files);
    }

    [Fact]
    public async Task Removing_the_video_deletes_the_file_clears_the_lesson_and_is_audited()
    {
        var lesson = await Lesson();
        await Upload(Marisol, lesson, "pick-up-the-towel.mp4", "video/mp4", Mp4);

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/lessons/{lesson}/video")).StatusCode);

        Assert.Empty(Store.Files);
        Assert.Equal(JsonValueKind.Null, (await Get(Marisol, $"/curriculum/lessons/{lesson}")).GetProperty("video").ValueKind);
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'LessonVideo'"), s => s.Contains("pick-up-the-towel.mp4"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).DeleteAsync($"/curriculum/lessons/{lesson}/video")).StatusCode);
    }

    [Fact]
    public async Task Other_roles_are_refused_and_another_organization_or_Learning_off_gets_404_without_touching_a_file()
    {
        var lesson = await Lesson();
        foreach (var who in new[] { Jaylen, Sofia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Upload(who, lesson, "clip.mp4", "video/mp4", Mp4)).StatusCode);
        }
        var northgate = await ModulesOn(Grace);
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = northgate.Append("Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await Upload(Grace, lesson, "clip.mp4", "video/mp4", Mp4)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).DeleteAsync($"/curriculum/lessons/{lesson}/video")).StatusCode);

        var on = await ModulesOn(Tom);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });
        Assert.Equal(HttpStatusCode.NotFound, (await Upload(Marisol, lesson, "clip.mp4", "video/mp4", Mp4)).StatusCode);
        Assert.Empty(Store.Files);
    }

    private async Task<Guid> Lesson()
    {
        var track = await Created(await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/tracks", new { name = "Leadership Foundations" }));
        var module = await Created(await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/modules", new { trackId = track, title = "Leading by Serving" }));
        return await Created(await _factory.ClientFor(Marisol).PostAsJsonAsync("/curriculum/lessons", new { moduleId = module, title = "Pick Up the Towel" }));
    }

    private static async Task<Guid> Created(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private static MultipartFormDataContent Form(string fileName, string contentType, byte[] bytes)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", fileName } };
    }

    private Task<HttpResponseMessage> Upload(Guid membership, Guid lesson, string fileName, string contentType, byte[] bytes) =>
        _factory.ClientFor(membership).PostAsync($"/curriculum/lessons/{lesson}/video", Form(fileName, contentType, bytes));

    private async Task<string[]> ModulesOn(Guid admin) =>
        (await Get(admin, "/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).ToArray();

    private static async Task<string?> Error(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("file").GetString();
    }

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
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
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
