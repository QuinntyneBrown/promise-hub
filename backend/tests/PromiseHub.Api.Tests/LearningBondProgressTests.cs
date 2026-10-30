using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-150 criterion 1: after Submit the guardian sees what was sent, to whom, the estimate, what happens next and the expected deposit window.
public sealed class LearningBondProgressTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_submitted_application_shows_what_was_sent_and_the_deposit_window()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");

        var response = await carmen.Http.GetAsync(carmen.Path($"/children/{Mateo}/progress"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var progress = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Northfield Credit Union", progress.GetProperty("provider").GetString());
        Assert.Equal("Submitted", progress.GetProperty("status").GetString());
        Assert.Equal(1400, progress.GetProperty("estimate").GetInt32());
        Assert.Equal("2027-01-15", progress.GetProperty("expectedFrom").GetString());
        Assert.Equal("2027-02-28", progress.GetProperty("expectedTo").GetString());
        Assert.Equal(0, progress.GetProperty("stepsDone").GetInt32());
        Assert.Equal("459", progress.GetProperty("fields").GetProperty("childSin").GetString());
        Assert.DoesNotContain("345123459", progress.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Before_Submit_or_for_a_child_without_a_claim_there_is_no_progress()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });

        Assert.Equal(HttpStatusCode.Conflict, (await carmen.Http.GetAsync(carmen.Path($"/children/{Mateo}/progress"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await carmen.Http.GetAsync(carmen.Path($"/children/{Sofia}/progress"))).StatusCode);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
