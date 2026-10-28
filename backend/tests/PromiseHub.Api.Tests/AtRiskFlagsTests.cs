using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-091 criteria 1, 2, 3, 4, 6 and 8 (a mentor raises an at-risk flag on one of his youth with a severity and a
// reason, field-by-field errors, one open flag per youth, admins and program directors notified and reading every flag, his open flags most
// serious first, audited without the reason, scope, roles, tenancy and Mentoring off), L2-065, L2-040, L2-007, L2-032.
public sealed class AtRiskFlagsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid Lucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");
    private const string Reason = "Asked me twice whether he could stay late because nobody is home after school.";

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _db = null!;

    // ---- criteria 1 and 6: raising a flag, audited without the reason

    [Fact]
    public async Task Daniel_raises_a_flag_on_Mateo_and_it_is_audited_without_the_reason()
    {
        var response = await Raise(Daniel, Body(Mateo));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var flag = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(Mateo, flag.GetProperty("childId").GetGuid());
        Assert.Equal("Mateo Rivera", flag.GetProperty("youthName").GetString());
        Assert.Equal("Medium", flag.GetProperty("severity").GetString());
        Assert.Equal(Reason, flag.GetProperty("reason").GetString());
        Assert.Equal("Daniel Osei", flag.GetProperty("raisedBy").GetString());
        Assert.Equal("Open", flag.GetProperty("status").GetString());
        Assert.Single(_db.Query("SELECT Id FROM AtRiskFlags"));
        var audit = _db.Query("SELECT Summary || ' ' || AfterJson FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'AtRiskFlag'");
        Assert.Single(audit);
        Assert.Contains("Mateo Rivera", audit[0]);
        Assert.Contains("Daniel Osei", audit[0]);
        Assert.Contains("\"Severity\":\"Medium\"", audit[0]);
        Assert.DoesNotContain("nobody is home", audit[0]);
    }

    // ---- criterion 2: each field checked on the server, one open flag per youth

    [Fact]
    public async Task Missing_and_invalid_fields_are_refused_field_by_field_and_a_second_open_flag_is_a_conflict()
    {
        var empty = await Errors(await Raise(Daniel, new { childId = (Guid?)null, severity = (string?)null, reason = "  " }));
        Assert.Equal("Choose a youth.", empty.GetProperty("childId").GetString());
        Assert.Equal("Choose how serious it is.", empty.GetProperty("severity").GetString());
        Assert.Equal("Say why you’re worried.", empty.GetProperty("reason").GetString());

        var wrong = await Errors(await Raise(Daniel, new { childId = Mateo, severity = "Critical", reason = new string('a', 1001) }));
        Assert.Equal("Choose how serious it is.", wrong.GetProperty("severity").GetString());
        Assert.Equal("Keep it to 1,000 characters.", wrong.GetProperty("reason").GetString());
        Assert.Empty(_db.Query("SELECT Id FROM AtRiskFlags"));

        Assert.Equal(HttpStatusCode.Created, (await Raise(Daniel, Body(Mateo))).StatusCode);
        var again = await Raise(Daniel, Body(Mateo) with { severity = "High" });
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("already-flagged", (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Single(_db.Query("SELECT Id FROM AtRiskFlags"));
    }

    // ---- criterion 4: his open flags, most serious first, whichever of the youth's mentors raised them

    [Fact]
    public async Task His_open_flags_list_most_serious_first_then_newest_with_his_youth_and_both_counts()
    {
        await Mentors(lead: Hana, supporting: Daniel);
        await Raise(Daniel, Body(Mateo) with { severity = "Low" });
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Raise(Hana, Body(Sofia) with { severity = "Medium" });
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Raise(Daniel, Body(Yusuf) with { severity = "High" });

        var flags = await Flags(Daniel, "");

        var items = flags.GetProperty("items").EnumerateArray().ToList();
        Assert.Equal(["Yusuf Haddad", "Sofía Rivera", "Mateo Rivera"], items.Select(i => i.GetProperty("youthName").GetString()));
        Assert.Equal("Hana Kim", items[1].GetProperty("raisedBy").GetString());
        Assert.Equal(3, flags.GetProperty("openCount").GetInt32());
        Assert.Equal(0, flags.GetProperty("resolvedCount").GetInt32());
        Assert.True(flags.GetProperty("canRaise").GetBoolean());
        var youth = flags.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()).ToList();
        Assert.Contains("Mateo Rivera", youth);
        Assert.Equal(youth.Order(StringComparer.Ordinal), youth);
        Assert.Empty((await Flags(Daniel, "?status=Resolved")).GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task A_youth_who_leaves_his_scope_drops_out_of_his_flags_and_the_flag_is_kept()
    {
        await Raise(Daniel, Body(Mateo));
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor")).StatusCode);

        Assert.Empty((await Flags(Daniel, "")).GetProperty("items").EnumerateArray());
        Assert.Single(_db.Query("SELECT Id FROM AtRiskFlags"));
    }

    // ---- criteria 3 and 4: admins and program directors are notified and read every flag

    [Fact]
    public async Task Raising_a_flag_notifies_every_admin_and_program_director_without_the_reason()
    {
        await Raise(Daniel, Body(Mateo));

        foreach (var reader in new[] { Marisol, Tom })
        {
            var notice = Assert.Single(await Notifications(reader), n => n.GetProperty("kind").GetString() == "mentoring");
            Assert.Equal("Daniel Osei flagged Mateo Rivera as at risk (Medium).", notice.GetProperty("text").GetString());
            Assert.Equal("/mentoring/flags", notice.GetProperty("link").GetString());
        }
        Assert.DoesNotContain(await Notifications(Jaylen), n => n.GetProperty("kind").GetString() == "mentoring");
        Assert.Empty(_db.Query("SELECT Id FROM Notifications WHERE Text LIKE '%nobody is home%'"));
    }

    [Fact]
    public async Task Flag_notifications_hide_while_Mentoring_is_off_and_come_back_when_it_is_on()
    {
        await Raise(Daniel, Body(Mateo));
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } })).IsSuccessStatusCode);
        Assert.DoesNotContain(await Notifications(Marisol), n => n.GetProperty("kind").GetString() == "mentoring");

        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Mentoring" } })).IsSuccessStatusCode);
        Assert.Contains(await Notifications(Marisol), n => n.GetProperty("kind").GetString() == "mentoring");
    }

    [Fact]
    public async Task Admins_and_program_directors_read_every_flag_of_the_organization_and_cannot_raise()
    {
        await Mentors(lead: Hana, supporting: Daniel);
        await Raise(Daniel, Body(Mateo) with { severity = "Low" });
        await Raise(Hana, Body(Sofia) with { severity = "High" });
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor")).StatusCode);

        foreach (var reader in new[] { Marisol, Tom })
        {
            var flags = await Flags(reader, "");
            Assert.Equal(["Sofía Rivera", "Mateo Rivera"], flags.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("youthName").GetString()));
            Assert.False(flags.GetProperty("canRaise").GetBoolean());
            Assert.Empty(flags.GetProperty("youth").EnumerateArray());
        }
    }

    [Fact]
    public async Task Northgate_admin_with_Mentoring_on_never_reads_Harbourview_flags_or_their_notifications()
    {
        await Raise(Daniel, Body(Mateo));
        Assert.True((await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring" } })).IsSuccessStatusCode);

        Assert.Empty((await Flags(Grace, "")).GetProperty("items").EnumerateArray());
        Assert.DoesNotContain(await Notifications(Grace), n => n.GetProperty("kind").GetString() == "mentoring");
    }

    // ---- criterion 8: scope, tenancy, roles and the module

    [Fact]
    public async Task A_youth_outside_his_scope_another_organization_other_roles_and_Mentoring_off_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Raise(Daniel, Body(Amara))).StatusCode);
        Assert.Single(_db.Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Child' AND upper(RecordId) = upper('{Amara}')"));
        Assert.Equal(HttpStatusCode.NotFound, (await Raise(Daniel, Body(Lucia))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Raise(Daniel, Body(Guid.NewGuid()))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Raise(Samuel, Body(Mateo))).StatusCode);
        foreach (var director in new[] { Marisol, Tom })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Raise(director, Body(Mateo))).StatusCode);
        }
        foreach (var who in new[] { Jaylen, Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Raise(who, Body(Mateo))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/mentoring/flags")).StatusCode);
        }
        Assert.Empty(_db.Query("SELECT Id FROM AtRiskFlags"));

        await Raise(Daniel, Body(Mateo));
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } })).IsSuccessStatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Raise(Daniel, Body(Sofia))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync("/mentoring/flags")).StatusCode);
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Mentoring" } })).IsSuccessStatusCode);
        Assert.Single((await Flags(Daniel, "")).GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task With_Mentoring_on_at_Northgate_its_mentor_never_reaches_Harbourview_flags_or_youth()
    {
        await Raise(Daniel, Body(Mateo));
        Assert.True((await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring" } })).IsSuccessStatusCode);

        var flags = await Flags(Samuel, "");
        Assert.Empty(flags.GetProperty("items").EnumerateArray());
        Assert.DoesNotContain("Mateo", flags.GetRawText());
        Assert.Equal(HttpStatusCode.NotFound, (await Raise(Samuel, Body(Mateo))).StatusCode);
        Assert.Single(_db.Query("SELECT Id FROM AtRiskFlags"));
    }

    private async Task Mentors(Guid lead, Guid supporting) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors",
            new { leadMentorId = lead, supportingMentorIds = new[] { supporting } })).StatusCode);

    private async Task<JsonElement> Flags(Guid membership, string query)
    {
        var response = await _factory.ClientFor(membership).GetAsync($"/mentoring/flags{query}");
        Assert.True(response.IsSuccessStatusCode, $"flags answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<List<JsonElement>> Notifications(Guid membership) =>
        [.. (await (await _factory.ClientFor(membership).GetAsync("/notifications")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items").EnumerateArray()];

    private sealed record FlagBody(Guid childId, string severity, string reason);

    private static FlagBody Body(Guid child) => new(child, "Medium", Reason);

    private Task<HttpResponseMessage> Raise(Guid membership, object body) => _factory.ClientFor(membership).PostAsJsonAsync("/mentoring/flags", body);

    private static async Task<JsonElement> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    public async Task InitializeAsync()
    {
        _db = new MentorReviewWork(_factory);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor", new { mentorId = Daniel })).StatusCode);
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
