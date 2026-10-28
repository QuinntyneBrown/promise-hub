using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-090 criteria 1, 2, 3, 4, 6, 7 and 8 (logging a mentor check-in for one of his youth, field-by-field errors,
// private by default, audited without its words, his own history newest first with filters, scope, roles, tenancy and Mentoring off),
// L2-065, L2-007, L2-032.
// Today at Harbourview (America/Toronto) is Thu 5 Nov 2026.
public sealed class MentorCheckInsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Yusuf = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Yusuf Haddad");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid Lucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");
    private const string Topics = "Fractions homework and the spelling bee on Friday.";
    private const string Private = "Carmen mentioned money is tight this month.";

    private readonly PromiseHubApiFactory _factory = new();
    private MentorReviewWork _db = null!;

    // ---- criteria 1, 3 and 7: logging, private by default, audited without its words

    [Fact]
    public async Task Daniel_logs_a_mentor_check_in_for_Mateo_private_by_default_and_audited_without_its_words()
    {
        var response = await Log(Daniel, Body(Mateo));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var saved = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(Mateo, saved.GetProperty("childId").GetGuid());
        Assert.Equal("Mateo Rivera", saved.GetProperty("youthName").GetString());
        Assert.Equal("2026-11-05", saved.GetProperty("date").GetString());
        Assert.Equal("OneToOne", saved.GetProperty("kind").GetString());
        Assert.Equal("Engaged", saved.GetProperty("engagement").GetString());
        Assert.Equal(Topics, saved.GetProperty("topics").GetString());
        Assert.Equal("Practise ten words each night.", saved.GetProperty("actionItems").GetString());
        Assert.Equal(Private, saved.GetProperty("privateNotes").GetString());
        Assert.Equal("2026-11-12", saved.GetProperty("followUpOn").GetString());
        Assert.False(saved.GetProperty("shared").GetBoolean());
        Assert.False(saved.GetProperty("guardianInformed").GetBoolean());
        Assert.Single(_db.Query("SELECT Id FROM MentorCheckIns"));
        var audit = _db.Query("SELECT Summary || ' ' || AfterJson FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'MentorCheckIn'");
        Assert.Single(audit);
        Assert.Contains("Mateo Rivera", audit[0]);
        Assert.Contains("Daniel Osei", audit[0]);
        Assert.Contains("\"Shared\":false", audit[0]);
        Assert.DoesNotContain("Fractions", audit[0]);
        Assert.DoesNotContain("Carmen", audit[0]);
        Assert.DoesNotContain("Practise", audit[0]);
    }

    [Fact]
    public async Task A_shared_check_in_with_the_guardian_informed_and_no_optional_words_is_kept_as_such()
    {
        var saved = await (await Log(Daniel, new { childId = Mateo, date = "2026-11-04", kind = "Call", engagement = "Low", shared = true, guardianInformed = true }))
            .Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(saved.GetProperty("shared").GetBoolean());
        Assert.True(saved.GetProperty("guardianInformed").GetBoolean());
        Assert.Equal(JsonValueKind.Null, saved.GetProperty("topics").ValueKind);
        Assert.Equal(JsonValueKind.Null, saved.GetProperty("followUpOn").ValueKind);
    }

    // ---- criterion 2: each field checked on the server

    [Fact]
    public async Task Missing_and_invalid_fields_are_refused_field_by_field_and_nothing_is_saved()
    {
        var empty = await Errors(await Log(Daniel, new { childId = (Guid?)null, date = (string?)null, kind = (string?)null, engagement = (string?)null }));
        Assert.Equal("Choose a youth.", empty.GetProperty("childId").GetString());
        Assert.Equal("Choose the date.", empty.GetProperty("date").GetString());
        Assert.Equal("Choose how you met.", empty.GetProperty("kind").GetString());
        Assert.Equal("Choose how it went.", empty.GetProperty("engagement").GetString());

        var wrong = await Errors(await Log(Daniel, new
        {
            childId = Mateo,
            date = "2026-11-06",
            kind = "Visit",
            engagement = "Ecstatic",
            topics = new string('a', 2001),
            actionItems = new string('a', 2001),
            privateNotes = new string('a', 2001),
            followUpOn = "2026-11-01",
        }));
        Assert.Equal("The date can’t be in the future.", wrong.GetProperty("date").GetString());
        Assert.Equal("Choose how you met.", wrong.GetProperty("kind").GetString());
        Assert.Equal("Choose how it went.", wrong.GetProperty("engagement").GetString());
        Assert.Equal("Keep it to 2,000 characters.", wrong.GetProperty("topics").GetString());
        Assert.Equal("Keep it to 2,000 characters.", wrong.GetProperty("actionItems").GetString());
        Assert.Equal("Keep it to 2,000 characters.", wrong.GetProperty("privateNotes").GetString());

        var early = await Errors(await Log(Daniel, Body(Mateo) with { followUpOn = "2026-11-04" }));
        Assert.Equal("The follow-up can’t be before the check-in.", early.GetProperty("followUpOn").GetString());
        Assert.Empty(_db.Query("SELECT Id FROM MentorCheckIns"));
    }

    // ---- criterion 8: scope, tenancy, roles and the module

    [Fact]
    public async Task A_youth_outside_his_scope_another_organization_other_roles_and_Mentoring_off_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Log(Daniel, Body(Amara))).StatusCode);
        Assert.Single(_db.Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Child' AND upper(RecordId) = upper('{Amara}')"));
        Assert.Equal(HttpStatusCode.Forbidden, (await Log(Hana, Body(Mateo))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Log(Daniel, Body(Lucia))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Log(Daniel, Body(Guid.NewGuid()))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Log(Samuel, Body(Mateo))).StatusCode);
        foreach (var who in new[] { Marisol, Tom, Jaylen, Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Log(who, Body(Mateo))).StatusCode);
        }
        Assert.Empty(_db.Query("SELECT Id FROM MentorCheckIns"));

        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Learning" } })).IsSuccessStatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Log(Daniel, Body(Mateo))).StatusCode);
    }

    // ---- criterion 4: his own history, newest first, filtered by youth or type

    [Fact]
    public async Task The_history_lists_only_his_check_ins_of_his_youth_newest_first_with_his_private_notes_and_filters()
    {
        await Mentors(lead: Hana, supporting: Daniel);
        await Log(Daniel, Body(Mateo) with { date = "2026-11-02", followUpOn = null });
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Log(Daniel, Body(Sofia) with { date = "2026-11-04", kind = "Call", privateNotes = null, followUpOn = null });
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Log(Daniel, Body(Mateo) with { date = "2026-11-04", kind = "Session", followUpOn = null });
        await Log(Hana, Body(Mateo) with { topics = "Hana’s own words." });

        var history = await History(Daniel, "");

        var items = history.GetProperty("items").EnumerateArray().ToList();
        Assert.Equal(["Session", "Call", "OneToOne"], items.Select(i => i.GetProperty("kind").GetString()));
        Assert.Equal(["Mateo Rivera", "Sofía Rivera", "Mateo Rivera"], items.Select(i => i.GetProperty("youthName").GetString()));
        Assert.Equal(Private, items[0].GetProperty("privateNotes").GetString());
        Assert.DoesNotContain("Hana’s own words.", history.GetRawText());
        var youth = history.GetProperty("youth").EnumerateArray().Select(y => y.GetProperty("name").GetString()).ToList();
        Assert.Contains("Mateo Rivera", youth);
        Assert.Contains("Sofía Rivera", youth);
        Assert.Equal(youth.Order(StringComparer.Ordinal), youth);

        Assert.Equal(2, (await History(Daniel, $"?childId={Mateo}")).GetProperty("items").GetArrayLength());
        Assert.Equal(["Call"], (await History(Daniel, "?kind=Call")).GetProperty("items").EnumerateArray().Select(i => i.GetProperty("kind").GetString()));
        Assert.Empty((await History(Daniel, $"?childId={Sofia}&kind=Session")).GetProperty("items").EnumerateArray());
        Assert.Single((await History(Hana, "")).GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task A_mentor_with_no_check_ins_gets_an_empty_history_and_a_youth_who_leaves_his_scope_drops_out()
    {
        Assert.Empty((await History(Daniel, "")).GetProperty("items").EnumerateArray());
        await Log(Daniel, Body(Mateo));

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).DeleteAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor")).StatusCode);

        Assert.Empty((await History(Daniel, "")).GetProperty("items").EnumerateArray());
        Assert.Single(_db.Query("SELECT Id FROM MentorCheckIns"));
    }

    [Fact]
    public async Task Filtering_by_a_youth_outside_his_scope_or_organization_other_roles_and_Mentoring_off_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/check-ins?childId={Amara}")).StatusCode);
        Assert.Single(_db.Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND upper(RecordId) = upper('{Amara}')"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/check-ins?childId={Lucia}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Samuel).GetAsync("/mentoring/check-ins")).StatusCode);
        foreach (var who in new[] { Marisol, Tom, Jaylen, Nadia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/mentoring/check-ins")).StatusCode);
        }
        await Log(Daniel, Body(Mateo));
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } })).IsSuccessStatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync("/mentoring/check-ins")).StatusCode);
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Mentoring" } })).IsSuccessStatusCode);
        Assert.Single((await History(Daniel, "")).GetProperty("items").EnumerateArray());
    }

    // ---- criterion 6: follow-ups on the dashboard from his latest check-in of each youth

    [Fact]
    public async Task The_dashboard_lists_the_follow_up_of_his_latest_check_in_per_youth_soonest_first_with_overdue_ones_marked()
    {
        await Mentors(lead: Hana, supporting: Daniel);
        await Log(Daniel, Body(Mateo) with { date = "2026-10-29", followUpOn = "2026-11-03" });
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Log(Daniel, Body(Mateo) with { date = "2026-11-04", followUpOn = "2026-11-12" });
        await Log(Daniel, Body(Sofia) with { date = "2026-11-02", followUpOn = "2026-11-10" });
        await Log(Daniel, Body(Yusuf) with { date = "2026-10-30", followUpOn = "2026-11-03" });
        await Log(Daniel, Body(Jordan) with { date = "2026-10-20", followUpOn = "2026-10-27" });
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await Log(Daniel, Body(Jordan) with { date = "2026-11-01", followUpOn = null });
        await Log(Hana, Body(Sofia) with { date = "2026-11-05", followUpOn = "2026-11-06" });

        var dashboard = await (await _factory.ClientFor(Daniel).GetAsync("/mentoring/dashboard")).Content.ReadFromJsonAsync<JsonElement>();

        var followUps = dashboard.GetProperty("followUps").EnumerateArray().ToList();
        Assert.Equal(["Yusuf Haddad", "Sofía Rivera", "Mateo Rivera"], followUps.Select(f => f.GetProperty("youthName").GetString()));
        Assert.Equal(["2026-11-03", "2026-11-10", "2026-11-12"], followUps.Select(f => f.GetProperty("followUpOn").GetString()));
        Assert.Equal([true, false, false], followUps.Select(f => f.GetProperty("overdue").GetBoolean()));
        Assert.Equal(Yusuf, followUps[0].GetProperty("childId").GetGuid());
        var hanas = await (await _factory.ClientFor(Hana).GetAsync("/mentoring/dashboard")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(["2026-11-06"], hanas.GetProperty("followUps").EnumerateArray().Select(f => f.GetProperty("followUpOn").GetString()));
    }

    private async Task Mentors(Guid lead, Guid supporting) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors",
            new { leadMentorId = lead, supportingMentorIds = new[] { supporting } })).StatusCode);

    private async Task<JsonElement> History(Guid membership, string query)
    {
        var response = await _factory.ClientFor(membership).GetAsync($"/mentoring/check-ins{query}");
        Assert.True(response.IsSuccessStatusCode, $"history answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private sealed record CheckInBody(Guid childId, string date, string kind, string engagement, string? topics, string? actionItems, string? privateNotes,
        string? followUpOn, bool shared, bool guardianInformed);

    private static CheckInBody Body(Guid child) =>
        new(child, "2026-11-05", "OneToOne", "Engaged", Topics, "Practise ten words each night.", Private, "2026-11-12", false, false);

    private Task<HttpResponseMessage> Log(Guid membership, object body) => _factory.ClientFor(membership).PostAsJsonAsync("/mentoring/check-ins", body);

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
