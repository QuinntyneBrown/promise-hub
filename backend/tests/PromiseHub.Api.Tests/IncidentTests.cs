using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-023 reporting incidents, L2-007 roles, L2-001 tenant isolation, L2-032 audit, L2-005 Incident log off.
public sealed class IncidentTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Priya = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_form_lists_the_children_and_names_the_supervisor()
    {
        var form = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>("/incidents/form");

        Assert.Equal("Marisol Delgado", form.GetProperty("supervisor").GetString());
        Assert.Contains(form.GetProperty("children").EnumerateArray(), c => c.GetProperty("name").GetString() == "Mateo Rivera");
    }

    [Fact]
    public async Task A_report_missing_facts_names_each_and_saves_nothing()
    {
        var response = await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report() with { WhatHappened = " ", ActionTaken = "", ChildId = null });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Describe what happened.", errors.GetProperty("whatHappened").GetString());
        Assert.Equal("Describe what you did.", errors.GetProperty("actionTaken").GetString());
        Assert.Equal("Choose the child involved.", errors.GetProperty("childId").GetString());
        Assert.Empty(Query("SELECT Id FROM Incidents"));
    }

    [Fact]
    public async Task A_complete_report_needs_review_emails_the_supervisors_and_is_audited()
    {
        var response = await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var incident = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/incidents/{id}");
        Assert.Equal("NeedsReview", incident.GetProperty("status").GetString());
        Assert.Equal("Mateo Rivera", incident.GetProperty("child").GetString());
        Assert.Equal("Jaylen Okafor", incident.GetProperty("reportedBy").GetString());
        Assert.Contains(Email.Sent, e => e.To == "marisol@harbourview.example" && e.Subject.Contains("Injury", StringComparison.Ordinal));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Incident' AND Action = 'Created'"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Incident' AND Action = 'Viewed'"));
    }

    [Fact]
    public async Task A_reporter_sees_only_their_own_reports_and_supervisors_see_the_log()
    {
        await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report());
        var aishas = (await (await _factory.ClientFor(Aisha).PostAsJsonAsync("/incidents", Report() with { Category = "Behaviour" })).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var mine = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>("/incidents");
        var log = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/incidents");

        Assert.False(mine.GetProperty("canReadLog").GetBoolean());
        Assert.Equal(["Injury"], mine.GetProperty("incidents").EnumerateArray().Select(i => i.GetProperty("category").GetString()));
        Assert.True(log.GetProperty("canReadLog").GetBoolean());
        Assert.Equal(2, log.GetProperty("incidents").GetArrayLength());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync($"/incidents/{aishas}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).GetAsync($"/incidents/{aishas}")).StatusCode);
    }

    [Fact]
    public async Task Youth_workers_and_volunteer_coordinators_report_but_never_read_others_reports()
    {
        var jaylens = (await (await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report())).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        foreach (var reader in new[] { Aisha, Priya })
        {
            Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(reader).PostAsJsonAsync("/incidents", Report() with { Category = "Other" })).StatusCode);
            var mine = await _factory.ClientFor(reader).GetFromJsonAsync<JsonElement>("/incidents");
            Assert.False(mine.GetProperty("canReadLog").GetBoolean());
            Assert.Equal(["Other"], mine.GetProperty("incidents").EnumerateArray().Select(i => i.GetProperty("category").GetString()));
            Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(reader).GetAsync($"/incidents/{jaylens}")).StatusCode);
        }
    }

    [Fact]
    public async Task A_supervisor_reviews_with_a_required_note_and_the_reporter_is_told()
    {
        var id = await Reported();

        var noNote = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/incidents/{id}/review", new { note = " ", outcome = "ClosedNoAction" });
        var reviewed = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/incidents/{id}/review", new { note = "Followed first-aid procedure correctly.", outcome = "ClosedNoAction" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, noNote.StatusCode);
        Assert.Equal("Write a review note.", (await noNote.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("note").GetString());
        Assert.Equal(HttpStatusCode.NoContent, reviewed.StatusCode);
        var incident = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/incidents/{id}");
        Assert.Equal("Closed", incident.GetProperty("status").GetString());
        Assert.Equal("Followed first-aid procedure correctly.", incident.GetProperty("review").GetProperty("note").GetString());
        Assert.Equal("Marisol Delgado", incident.GetProperty("review").GetProperty("by").GetString());
        Assert.Contains(Email.Sent, e => e.To == "jaylen@harbourview.example" && e.Subject.Contains("reviewed", StringComparison.Ordinal));
        Assert.Equal(HttpStatusCode.Conflict, (await _factory.ClientFor(Marisol).PostAsJsonAsync($"/incidents/{id}/review", new { note = "Again", outcome = "ClosedNoAction" })).StatusCode);
    }

    [Fact]
    public async Task Keep_open_leaves_it_open_and_follow_ups_are_kept_even_after_closing()
    {
        var id = await Reported();

        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/incidents/{id}/review", new { note = "Waiting on the building manager.", outcome = "KeepOpen" });
        Assert.Equal("Open", (await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/incidents/{id}")).GetProperty("status").GetString());
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/incidents/{id}/review", new { note = "Lighting fixed.", outcome = "ClosedPolicyChange" });
        var empty = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/incidents/{id}/notes", new { text = "" });
        var note = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/incidents/{id}/notes", new { text = "Called Carmen the next day; Mateo is fine." });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, empty.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, note.StatusCode);
        var incident = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/incidents/{id}");
        Assert.Equal("ClosedPolicyChange", incident.GetProperty("review").GetProperty("outcome").GetString());
        Assert.Equal("Called Carmen the next day; Mateo is fine.", incident.GetProperty("followUps")[0].GetProperty("text").GetString());
        Assert.Contains(incident.GetProperty("trail").EnumerateArray(), t => t.GetProperty("text").GetString()!.Contains("Marisol Delgado opened the report", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_supervisor_reopens_a_closed_report_and_others_cannot_review_or_reopen()
    {
        var id = await Reported();
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/incidents/{id}/review", new { note = "Done.", outcome = "ClosedNoAction" });

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsync($"/incidents/{id}/reopen", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/incidents/{id}/review", new { note = "Mine", outcome = "ClosedNoAction" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).PostAsJsonAsync($"/incidents/{id}/notes", new { text = "Hi" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PostAsync($"/incidents/{id}/reopen", null)).StatusCode);
        Assert.Equal("Open", (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/incidents/{id}")).GetProperty("status").GetString());
        Assert.Equal(2, Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Incident' AND Action = 'Updated'").Count);
    }

    private async Task<Guid> Reported() =>
        (await (await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report())).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

    [Fact]
    public async Task Another_organization_never_sees_the_incident()
    {
        var id = (await (await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report())).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Incidents" } })).StatusCode);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/incidents/{id}")).StatusCode);
        Assert.Equal(0, (await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/incidents")).GetProperty("incidents").GetArrayLength());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _factory.ClientFor(Grace).PostAsJsonAsync("/incidents", Report())).StatusCode);
    }

    [Fact]
    public async Task With_the_Incident_log_off_every_endpoint_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync("/incidents")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).PostAsJsonAsync("/incidents", Report())).StatusCode);
    }

    private static IncidentReport Report() => new("Injury", Mateo, "2026-10-21T18:40:00Z", "Stairwell", "Mateo slipped on the stairs and hit his knee.", "Ice pack for ten minutes; he went back to tutoring.", "CalledAndReached", "Minor");

    private sealed record IncidentReport(string Category, Guid? ChildId, string OccurredAt, string Place, string WhatHappened, string ActionTaken, string GuardianContact, string Severity);

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
