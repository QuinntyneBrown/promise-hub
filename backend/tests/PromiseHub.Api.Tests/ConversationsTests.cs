using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-106 criteria 1 to 7 (a mentor and the youth he mentors write to each other in one conversation, newest
// counts, read on open, audited without the words, plain text, nobody else reads or writes, tenancy, Messages or Mentoring off), L2-032.
// Nadia (18) needs no consent; Sofía's consent is L2-108 (ConversationSafeguardsTests).
public sealed class ConversationsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Daniel_writes_to_Nadia_she_sees_it_as_new_reads_it_and_replies_and_the_audit_log_names_them_without_the_words()
    {
        var sent = await Send(Daniel, Nadia, "Good luck with the interview tomorrow.");
        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        var message = await sent.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Good luck with the interview tomorrow.", message.GetProperty("body").GetString());
        Assert.True(message.GetProperty("mine").GetBoolean());
        Assert.Equal("Daniel Osei", message.GetProperty("from").GetString());

        var list = Assert.Single((await _factory.ClientFor(Nadia).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray());
        Assert.Equal(Nadia, list.GetProperty("youthId").GetGuid());
        Assert.Equal("Daniel Osei", list.GetProperty("mentorName").GetString());
        Assert.Equal(1, list.GetProperty("unread").GetInt32());
        Assert.Equal("Good luck with the interview tomorrow.", list.GetProperty("lastMessage").GetString());
        Assert.False(list.GetProperty("lastMessageMine").GetBoolean());

        var thread = await _factory.ClientFor(Nadia).GetFromJsonAsync<JsonElement>($"/conversations/{Nadia}");
        Assert.True(thread.GetProperty("canSend").GetBoolean());
        Assert.Equal(JsonValueKind.Null, thread.GetProperty("blocked").ValueKind);
        Assert.Equal("Nadia Haddad", thread.GetProperty("youthName").GetString());
        Assert.Equal("Daniel Osei", thread.GetProperty("mentorName").GetString());
        var only = Assert.Single(thread.GetProperty("messages").EnumerateArray());
        Assert.False(only.GetProperty("mine").GetBoolean());
        Assert.Equal(0, Assert.Single((await _factory.ClientFor(Nadia).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray()).GetProperty("unread").GetInt32());

        _factory.Clock.Advance(TimeSpan.FromMinutes(3));
        Assert.Equal(HttpStatusCode.Created, (await Send(Nadia, Nadia, "Thanks! I'm nervous.")).StatusCode);
        var daniel = Assert.Single((await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray());
        Assert.Equal("Nadia Haddad", daniel.GetProperty("youthName").GetString());
        Assert.Equal(1, daniel.GetProperty("unread").GetInt32());
        var both = (await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>($"/conversations/{Nadia}")).GetProperty("messages").EnumerateArray().ToList();
        Assert.Equal(["Good luck with the interview tomorrow.", "Thanks! I'm nervous."], both.Select(m => m.GetProperty("body").GetString()));
        Assert.Equal([true, false], both.Select(m => m.GetProperty("mine").GetBoolean()));

        var audit = Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'DirectMessage'");
        Assert.Equal(2, audit.Count);
        Assert.Contains("Daniel Osei", audit[0], StringComparison.Ordinal);
        Assert.Contains("Nadia Haddad", audit[0], StringComparison.Ordinal);
        Assert.DoesNotContain(audit, a => a.Contains("interview", StringComparison.Ordinal) || a.Contains("nervous", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Daniel_lists_one_conversation_per_youth_he_mentors_with_a_youth_account_and_Hana_none()
    {
        await Assign(SofiaChild, Daniel);
        var daniel = (await _factory.ClientFor(Daniel).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray().ToList();
        var hana = (await _factory.ClientFor(Hana).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations");

        Assert.Equal(["Nadia Haddad", "Sofía Rivera"], daniel.Select(c => c.GetProperty("youthName").GetString()).Order());
        Assert.All(daniel, c => Assert.Equal(JsonValueKind.Null, c.GetProperty("lastMessage").ValueKind));
        Assert.Empty(hana.EnumerateArray());
    }

    [Fact]
    public async Task An_empty_or_too_long_message_answers_422_and_markup_is_kept_as_text()
    {
        var empty = await Send(Daniel, Nadia, "   ");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, empty.StatusCode);
        Assert.Equal("Write a message.", (await empty.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("body").GetString());
        var tooLong = await Send(Daniel, Nadia, new string('a', 2001));
        Assert.Equal("Keep it to 2,000 characters.", (await tooLong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("body").GetString());
        Assert.Empty(Query("SELECT Id FROM DirectMessages"));

        await Send(Daniel, Nadia, "<b>Room 2</b> & <script>alert(1)</script>");
        var body = Assert.Single((await _factory.ClientFor(Nadia).GetFromJsonAsync<JsonElement>($"/conversations/{Nadia}")).GetProperty("messages").EnumerateArray()).GetProperty("body").GetString();
        Assert.Equal("<b>Room 2</b> & <script>alert(1)</script>", body);
    }

    [Fact]
    public async Task Another_mentor_staff_a_volunteer_and_another_youth_can_neither_read_nor_write_Nadias_conversation()
    {
        await Send(Daniel, Nadia, "Good luck with the interview tomorrow.");
        await Assign(SofiaChild, Daniel);

        foreach (var who in new[] { Hana, Sofia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/conversations/{Nadia}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Send(who, Nadia, "Hi")).StatusCode);
        }
        foreach (var who in new[] { Aisha, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/conversations")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync($"/conversations/{Nadia}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Send(who, Nadia, "Hi")).StatusCode);
        }
        // A staff member or another member that is not a youth is no conversation at all.
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/conversations/{Marisol}")).StatusCode);
        Assert.Single(Query("SELECT Id FROM DirectMessages"));
    }

    [Fact]
    public async Task Northgate_never_reaches_Harbourview_conversations_and_with_Messages_or_Mentoring_off_every_endpoint_answers_404()
    {
        await Send(Daniel, Nadia, "Good luck with the interview tomorrow.");
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "Mentoring" } });

        Assert.Empty((await _factory.ClientFor(Samuel).GetFromJsonAsync<JsonElement>("/conversations")).GetProperty("conversations").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Samuel).GetAsync($"/conversations/{Nadia}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Samuel, Nadia, "Hi")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/conversations/{Lucia}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Daniel, Lucia, "Hi")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages", "Learning" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync("/conversations")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Nadia).GetAsync($"/conversations/{Nadia}")).StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Mentoring", "Learning" } });
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Nadia, Nadia, "Hi")).StatusCode);
        Assert.Single(Query("SELECT Id FROM DirectMessages"));
    }

    private Task<HttpResponseMessage> Send(Guid who, Guid youth, string body) =>
        _factory.ClientFor(who).PostAsJsonAsync($"/conversations/{youth}/messages", new { body });

    private async Task Assign(Guid child, Guid mentor) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{child}/mentor", new { mentorId = mentor })).StatusCode);

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
        Assert.True((await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild })).IsSuccessStatusCode);
        await Assign(NadiaChild, Daniel);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
