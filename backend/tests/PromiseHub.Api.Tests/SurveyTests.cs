using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-043 surveys, L2-026 guardian links and verification, L2-027 household language, L2-024 results in reports, L2-005 Reports off, L2-001 tenants.
public sealed partial class SurveyTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task Sending_a_survey_texts_each_household_a_link_per_child()
    {
        var sent = await Send(Marisol);

        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        var links = await Links();
        Assert.Contains("Mateo", links.Keys);
        Assert.Contains("Jordan", links.Keys);
    }

    [Fact]
    public async Task A_verified_guardian_sees_the_survey_in_the_household_language()
    {
        await Send(Marisol);
        var token = (await Links())["Mateo"];
        var before = await _guardian.GetAsync($"/g/survey/{token}");
        await Verify(token);

        var survey = await _guardian.GetFromJsonAsync<JsonElement>($"/g/survey/{token}");

        Assert.Equal(HttpStatusCode.Unauthorized, before.StatusCode);
        Assert.Equal("es", survey.GetProperty("language").GetString());
        Assert.Equal("Tutoring night", survey.GetProperty("eventName").GetString());
        Assert.Equal("Mateo", survey.GetProperty("childFirstName").GetString());
        Assert.Equal("Open", survey.GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_rating_is_required_and_a_survey_is_answered_once()
    {
        await Send(Marisol);
        var token = (await Links())["Mateo"];
        await Verify(token);

        var missing = await _guardian.PostAsJsonAsync($"/g/survey/{token}", new { rating = (int?)null, comment = "" });
        var answered = await _guardian.PostAsJsonAsync($"/g/survey/{token}", new { rating = 4, comment = "Mateo loved it." });
        var again = await _guardian.PostAsJsonAsync($"/g/survey/{token}", new { rating = 5, comment = "" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, missing.StatusCode);
        Assert.Equal("Pick a number from 1 to 5.", (await missing.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("rating").GetString());
        Assert.Equal(HttpStatusCode.NoContent, answered.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("Answered", (await _guardian.GetFromJsonAsync<JsonElement>($"/g/survey/{token}")).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Answers_feed_the_report()
    {
        await Send(Marisol);
        var token = (await Links())["Mateo"];
        await Verify(token);
        await _guardian.PostAsJsonAsync($"/g/survey/{token}", new { rating = 4, comment = "" });

        var report = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/reports");

        Assert.Equal(1, report.GetProperty("surveyResponses").GetInt32());
        Assert.Equal(4.0, report.GetProperty("surveyAverage").GetDouble());
    }

    [Fact]
    public async Task A_survey_closes_after_a_week()
    {
        await Send(Marisol);
        var token = (await Links())["Mateo"];
        await Verify(token);
        _factory.Clock.Advance(TimeSpan.FromDays(8));

        Assert.Equal("Closed", (await _guardian.GetFromJsonAsync<JsonElement>($"/g/survey/{token}")).GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await _guardian.PostAsJsonAsync($"/g/survey/{token}", new { rating = 5, comment = "" })).StatusCode);
    }

    [Fact]
    public async Task Youth_workers_cannot_send_another_organization_cannot_see_the_event_and_Reports_off_hides_it()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Aisha)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Grace)).StatusCode);

        await Send(Marisol);
        var token = (await Links())["Mateo"];
        await Verify(token);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.GetAsync($"/g/survey/{token}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Marisol)).StatusCode);
    }

    private Task<HttpResponseMessage> Send(Guid membership) => _factory.ClientFor(membership).PostAsJsonAsync($"/events/{Tonight}/survey", new { });

    private async Task<Dictionary<string, string>> Links()
    {
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        return Sms.Sent.SelectMany(s => LinkPattern().Matches(s.Text)).GroupBy(m => m.Groups["child"].Value).ToDictionary(g => g.Key, g => g.Last().Groups["token"].Value);
    }

    private async Task Verify(string token)
    {
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var verified = await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value });
        Assert.Equal(HttpStatusCode.NoContent, verified.StatusCode);
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"(?<child>[\p{L}]+): \S+/g/survey/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex LinkPattern();

    public Task InitializeAsync()
    {
        _guardian = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
