using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-069 criteria 3 and 6 (a lesson's video streams with range requests to a youth who may open the lesson), L2-068 criteria 3 to 7.
public sealed class LearningVideoTests : IAsyncLifetime
{
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly byte[] Mp4 = [0, 0, 0, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', (byte)'i', (byte)'s', (byte)'o', (byte)'m', 1, 2, 3, 4, 5, 6, 7, 8];
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();
    private LearningContent _c = null!;

    [Fact]
    public async Task The_lesson_video_streams_to_her_with_its_content_type_and_honours_a_range()
    {
        await Upload(_c.Strengths);
        Assert.True((await Get($"/learning/lessons/{_c.Strengths}")).GetProperty("hasVideo").GetBoolean());

        var whole = await _factory.ClientFor(LearningContent.Nadia).GetAsync($"/learning/lessons/{_c.Strengths}/video");
        Assert.Equal(HttpStatusCode.OK, whole.StatusCode);
        Assert.Equal("video/mp4", whole.Content.Headers.ContentType?.MediaType);
        Assert.Equal(Mp4, await whole.Content.ReadAsByteArrayAsync());

        var request = new HttpRequestMessage(HttpMethod.Get, $"/learning/lessons/{_c.Strengths}/video");
        request.Headers.Range = new RangeHeaderValue(4, 7);
        var part = await _factory.ClientFor(LearningContent.Nadia).SendAsync(request);
        Assert.Equal(HttpStatusCode.PartialContent, part.StatusCode);
        Assert.Equal("ftyp"u8.ToArray(), await part.Content.ReadAsByteArrayAsync());
        Assert.Equal(Mp4.Length, part.Content.Headers.ContentRange?.Length);
    }

    [Fact]
    public async Task A_lesson_without_a_video_is_not_found_and_a_locked_lessons_video_is_refused()
    {
        await Upload(_c.Values);

        Assert.Equal(HttpStatusCode.NotFound, (await Video(LearningContent.Nadia, _c.Strengths)).StatusCode);
        var locked = await Video(LearningContent.Nadia, _c.Values);
        Assert.Equal(HttpStatusCode.Forbidden, locked.StatusCode);
        Assert.Equal("locked", (await locked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Other_roles_the_consent_gate_another_organization_and_Learning_off_get_no_video()
    {
        await Upload(_c.Strengths);

        Assert.Equal(HttpStatusCode.Forbidden, (await Video(Daniel, _c.Strengths)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Video(LearningContent.Marisol, _c.Strengths)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Video(Sofia, _c.Strengths)).StatusCode);

        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club")}/enrollments", new { childId = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera") });
        Assert.Equal(HttpStatusCode.NotFound, (await Video(Lucia, _c.Strengths)).StatusCode);

        await _factory.ClientFor(LearningContent.Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await Video(LearningContent.Nadia, _c.Strengths)).StatusCode);
    }

    private Task<HttpResponseMessage> Video(Guid membership, Guid lesson) => _factory.ClientFor(membership).GetAsync($"/learning/lessons/{lesson}/video");

    private async Task Upload(Guid lesson)
    {
        var file = new ByteArrayContent(Mp4);
        file.Headers.ContentType = new MediaTypeHeaderValue("video/mp4");
        var response = await _factory.ClientFor(LearningContent.Marisol).PostAsync($"/curriculum/lessons/{lesson}/video", new MultipartFormDataContent { { file, "file", "lesson.mp4" } });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task<JsonElement> Get(string path)
    {
        var response = await _factory.ClientFor(LearningContent.Nadia).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _c = await new LearningContent(_factory).BuildAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
