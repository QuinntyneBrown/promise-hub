using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-108 criteria 1 to 4 (a minor's conversation waits for a guardian's consent both ways and again after a
// withdrawal, only the current mentor and the youth write, reassignment moves the conversation, nothing is edited or deleted, program
// directors and admins read every conversation read only with each opening audited), L2-057, L2-032.
public sealed partial class ConversationSafeguardsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");

    // No route edits or deletes a message: the API answers 404, 405, or 403 for a member the fallback policy refuses.
    private static readonly HttpStatusCode[] Refused = [HttpStatusCode.NotFound, HttpStatusCode.MethodNotAllowed, HttpStatusCode.Forbidden];

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task Without_consent_neither_Daniel_nor_Sofia_can_write_and_the_conversation_says_it_is_waiting_for_consent()
    {
        var daniel = await Send(Daniel, Sofia, "Hi Sofía, welcome!");
        var sofia = await Send(Sofia, Sofia, "Hi Daniel");

        Assert.Equal(HttpStatusCode.Conflict, daniel.StatusCode);
        Assert.Equal("consent", (await daniel.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("blocked").GetString());
        Assert.Equal(HttpStatusCode.Conflict, sofia.StatusCode);
        var thread = await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>($"/conversations/{Sofia}");
        Assert.Equal("consent", thread.GetProperty("blocked").GetString());
        Assert.False(thread.GetProperty("canSend").GetBoolean());
        var row = (await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray()
            .Single(c => c.GetProperty("youthId").GetGuid() == Sofia);
        Assert.Equal("consent", row.GetProperty("blocked").GetString());
        Assert.Empty(Query("SELECT Id FROM DirectMessages"));
    }

    [Fact]
    public async Task Once_Carmen_consents_they_write_and_after_she_withdraws_the_next_message_is_refused_while_the_history_stays()
    {
        var token = await Consented();
        Assert.Equal(HttpStatusCode.Created, (await Send(Daniel, Sofia, "Hi Sofía, welcome!")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Send(Sofia, Sofia, "Hi Daniel")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync($"/g/consent/{token}/withdraw", new { })).StatusCode);

        Assert.Equal(HttpStatusCode.Conflict, (await Send(Daniel, Sofia, "Are you there?")).StatusCode);
        var thread = await _factory.ClientFor(Sofia).GetFromJsonAsync<JsonElement>($"/conversations/{Sofia}");
        Assert.Equal(2, thread.GetProperty("messages").GetArrayLength());
        Assert.Equal("consent", thread.GetProperty("blocked").GetString());
    }

    [Fact]
    public async Task When_Nadia_is_reassigned_to_Hana_Daniel_loses_the_conversation_and_Hana_starts_a_new_one()
    {
        Assert.Equal(HttpStatusCode.Created, (await Send(Daniel, Nadia, "Good luck tomorrow.")).StatusCode);

        await Assign(NadiaChild, Hana);

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/conversations/{Nadia}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Daniel, Nadia, "Still there?")).StatusCode);
        Assert.Empty((await _factory.ClientFor(Hana).GetFromJsonAsync<JsonElement>($"/conversations/{Nadia}")).GetProperty("messages").EnumerateArray());
        Assert.Equal(HttpStatusCode.Created, (await Send(Hana, Nadia, "Hi Nadia, I'm Hana.")).StatusCode);
        // Program directors still read both, each with its mentor.
        var all = (await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/conversations/{Nadia}")).GetProperty("messages").EnumerateArray().ToList();
        Assert.Equal(["Daniel Osei", "Hana Kim"], all.Select(m => m.GetProperty("from").GetString()));
    }

    [Fact]
    public async Task Marisol_and_Tom_read_every_conversation_read_only_each_opening_is_audited_and_they_cannot_write()
    {
        await Send(Daniel, Nadia, "Good luck tomorrow.");

        var list = Assert.Single((await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray());
        Assert.Equal("Nadia Haddad", list.GetProperty("youthName").GetString());
        Assert.Equal("Daniel Osei", list.GetProperty("mentorName").GetString());
        var thread = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/conversations/{Nadia}");
        Assert.False(thread.GetProperty("canSend").GetBoolean());
        Assert.True(thread.GetProperty("readOnly").GetBoolean());
        Assert.Single(thread.GetProperty("messages").EnumerateArray());
        // A supervisor's opening marks nothing read for Nadia.
        Assert.Equal(1, Assert.Single((await _factory.ClientFor(Nadia).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray()).GetProperty("unread").GetInt32());

        var viewed = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Viewed' AND RecordType = 'Conversation'"));
        Assert.Contains("Nadia Haddad", viewed, StringComparison.Ordinal);
        Assert.Contains("Daniel Osei", viewed, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Marisol, Nadia, "Hello")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Tom, Nadia, "Hello")).StatusCode);
        foreach (var who in new[] { Jaylen, Aisha })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/conversations/{Nadia}")).StatusCode);
        }
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/conversations/{Nadia}")).StatusCode);
    }

    [Fact]
    public async Task Nobody_can_edit_or_delete_a_message()
    {
        var sent = await Send(Daniel, Nadia, "Good luck tomorrow.");
        var id = (await sent.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        foreach (var who in new[] { Daniel, Nadia, Tom })
        {
            Assert.Contains((await _factory.ClientFor(who).DeleteAsync($"/conversations/{Nadia}/messages/{id}")).StatusCode, Refused);
            Assert.Contains((await _factory.ClientFor(who).PutAsJsonAsync($"/conversations/{Nadia}/messages/{id}", new { body = "Changed" })).StatusCode, Refused);
        }
        Assert.Equal("Good luck tomorrow.", Assert.Single(Query("SELECT Body FROM DirectMessages")));
    }

    private Task<HttpResponseMessage> Send(Guid who, Guid youth, string body) =>
        _factory.ClientFor(who).PostAsJsonAsync($"/conversations/{youth}/messages", new { body });

    private async Task Assign(Guid child, Guid mentor) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{child}/mentor", new { mentorId = mentor })).StatusCode);

    /// <summary>Sofía asks; Carmen verifies the link and consents; returns the link token.</summary>
    private async Task<string> Consented()
    {
        Assert.Equal(HttpStatusCode.Accepted, (await _factory.ClientFor(Sofia).PostAsync("/learning/consent-request", null)).StatusCode);
        var sms = _factory.Services.GetRequiredService<FakeSmsSender>();
        var token = LinkPattern().Match(sms.Sent.Last(s => s.Text.Contains("/g/consent/", StringComparison.Ordinal)).Text).Groups["token"].Value;
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var code = CodePattern().Match(sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code });
        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync($"/g/consent/{token}/sign", new { name = "Carmen Rivera", relationship = "Parent", agree = true })).StatusCode);
        return token;
    }

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"/g/consent/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex LinkPattern();

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

    public async Task InitializeAsync()
    {
        _guardian = _factory.CreateClient();
        Assert.True((await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild })).IsSuccessStatusCode);
        await Assign(NadiaChild, Daniel);
        await Assign(SofiaChild, Daniel);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
