using System.Net;
using System.Net.Http.Json;
using System.Text;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-107 criteria 1 to 3 (the event stream of a signed-in member in the active organization, a conversation
// event to the youth and her mentor only, an announcement event to its in-app recipients only, no words in any event, nothing across
// organizations, anonymous 401), L2-001.
public sealed class RealtimeTests : IAsyncLifetime
{
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(5);
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");

    private readonly PromiseHubApiFactory _factory = new();
    private readonly List<IDisposable> _open = [];

    [Fact]
    public async Task A_message_from_Daniel_reaches_Nadias_open_stream_and_his_own_as_a_conversation_event_with_no_words()
    {
        var nadia = await Listen(Nadia);
        var daniel = await Listen(Daniel);
        var hana = await Listen(Hana);
        var samuel = await Listen(Samuel);

        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(Daniel).PostAsJsonAsync($"/conversations/{Nadia}/messages", new { body = "Good luck with the interview tomorrow." })).StatusCode);

        var toNadia = await nadia.NextEventAsync(Wait);
        Assert.Equal("conversation", toNadia.Event);
        Assert.Equal($"{{\"youthId\":\"{Nadia}\"}}", toNadia.Data);
        Assert.DoesNotContain("interview", toNadia.Data, StringComparison.Ordinal);
        Assert.Equal("conversation", (await daniel.NextEventAsync(Wait)).Event);
        Assert.Null(await hana.NextEventOrNullAsync(TimeSpan.FromMilliseconds(500)));
        Assert.Null(await samuel.NextEventOrNullAsync(TimeSpan.FromMilliseconds(500)));
    }

    [Fact]
    public async Task An_announcement_sent_now_reaches_its_in_app_recipients_only_and_one_of_another_organization_never_does()
    {
        var sofia = await Listen(Sofia);
        var nadia = await Listen(Nadia);
        var lucia = await Listen(Lucia);

        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(Marisol).PostAsJsonAsync("/announcements",
            new { title = "Tutoring night moves to Room 2", body = "Same time, 4:00 pm.", programId = Tutoring, audience = "Youth", sendAt = (string?)null })).StatusCode);

        var toSofia = await sofia.NextEventAsync(Wait);
        Assert.Equal("announcement", toSofia.Event);
        Assert.Equal("{}", toSofia.Data);
        // Nadia is enrolled in After-School Tutoring too (InitializeAsync); Lucía is at Northgate.
        Assert.Equal("announcement", (await nadia.NextEventAsync(Wait)).Event);
        Assert.Null(await lucia.NextEventOrNullAsync(TimeSpan.FromMilliseconds(500)));
    }

    [Fact]
    public async Task A_scheduled_announcement_sends_no_event_now()
    {
        var sofia = await Listen(Sofia);

        await _factory.ClientFor(Marisol).PostAsJsonAsync("/announcements",
            new { title = "Field day", body = "Wear running shoes.", programId = Tutoring, audience = "Youth", sendAt = _factory.Clock.GetUtcNow().AddHours(10) });

        Assert.Null(await sofia.NextEventOrNullAsync(TimeSpan.FromMilliseconds(500)));
    }

    [Fact]
    public async Task The_stream_is_text_event_stream_for_a_signed_in_member_and_anonymous_requests_answer_401()
    {
        var response = await _factory.ClientFor(Tom).GetAsync("/realtime", HttpCompletionOption.ResponseHeadersRead);
        _open.Add(response);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/event-stream", response.Content.Headers.ContentType?.MediaType);

        var anonymous = await _factory.CreateClient().GetAsync("/realtime", HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    private async Task<EventReader> Listen(Guid who)
    {
        var response = await _factory.ClientFor(who).GetAsync("/realtime", HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        _open.Add(response);
        var reader = new EventReader(new StreamReader(await response.Content.ReadAsStreamAsync(), Encoding.UTF8));
        await reader.ConnectedAsync(Wait);
        return reader;
    }

    public async Task InitializeAsync()
    {
        Assert.True((await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild })).IsSuccessStatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{NadiaChild}/mentor", new { mentorId = Daniel })).StatusCode);
    }

    public async Task DisposeAsync()
    {
        _open.ForEach(o => o.Dispose());
        await _factory.DisposeAsync();
    }

    /// <summary>Reads server-sent events line by line: comments are skipped, an event is its name and data up to the blank line.</summary>
    private sealed class EventReader(StreamReader reader)
    {
        private Task<string?>? _pending;

        public async Task ConnectedAsync(TimeSpan wait)
        {
            var line = await ReadLineAsync(wait) ?? throw new InvalidOperationException("The stream closed.");
            Assert.StartsWith(":", line, StringComparison.Ordinal);
        }

        public async Task<(string Event, string Data)> NextEventAsync(TimeSpan wait) =>
            await NextEventOrNullAsync(wait) ?? throw new TimeoutException("No event arrived.");

        public async Task<(string Event, string Data)?> NextEventOrNullAsync(TimeSpan wait)
        {
            var until = DateTime.UtcNow + wait;
            string? name = null;
            string? data = null;
            while (DateTime.UtcNow < until)
            {
                var line = await ReadLineAsync(until - DateTime.UtcNow);
                if (line is null)
                {
                    return null;
                }
                if (line.StartsWith("event: ", StringComparison.Ordinal))
                {
                    name = line["event: ".Length..];
                }
                else if (line.StartsWith("data: ", StringComparison.Ordinal))
                {
                    data = line["data: ".Length..];
                }
                else if (line.Length == 0 && name is not null)
                {
                    return (name, data ?? string.Empty);
                }
            }
            return null;
        }

        private async Task<string?> ReadLineAsync(TimeSpan wait)
        {
            _pending ??= reader.ReadLineAsync();
            var finished = await Task.WhenAny(_pending, Task.Delay(wait < TimeSpan.Zero ? TimeSpan.Zero : wait));
            if (finished != _pending)
            {
                return null;
            }
            var line = await _pending;
            _pending = null;
            return line;
        }
    }
}
