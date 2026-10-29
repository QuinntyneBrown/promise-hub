using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-130 criteria 1 to 6 (Cohort and Youth email columns: matched, previewed, placed and invited once under the
// youth-invitation rules, audited; idempotent on a re-run; Learning off and a program director refused; cohorts matched in the organization).
public sealed class ImportCohortsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");

    private const string Csv =
        "Student,DOB,Parent,Cell,Group,Youth email\n" +
        "Ava Chen,2012-04-02,Mei Chen,905-555-0201,After-School Tutoring,ava.chen@example.com\n" +
        "Leo Chen,2018-09-15,Mei Chen,905-555-0201,saturday  sports,leo.chen@example.com\n" +
        "Zoe Park,2013-01-20,Jin Park,905-555-0301,Drama Club,\n" +
        "Kai Lee,2011-06-01,Ann Lee,905-555-0401,,ava.chen@example.com\n" +
        "Noa Kim,,Ji Kim,905-555-0501,After‑School Tutoring,noa.kim@example.com\n" +
        "Ria Das,2010-02-02,Raj Das,905-555-0601,Kids Club,tom@harbourview.example\n";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Group_and_Youth_email_columns_are_matched_to_Cohort_and_YouthEmail()
    {
        var upload = await (await Upload(Tom, Csv)).Content.ReadFromJsonAsync<JsonElement>();

        var columns = upload.GetProperty("columns").EnumerateArray().ToDictionary(c => c.GetProperty("name").GetString()!, c => c.GetProperty("field").GetString());
        Assert.Equal("Cohort", columns["Group"]);
        Assert.Equal("YouthEmail", columns["Youth email"]);
    }

    [Fact]
    public async Task The_preview_counts_cohort_places_and_invitations_and_says_why_a_row_is_not_placed_or_invited()
    {
        var id = await UploadId(Tom, Csv);

        var preview = await Map(Tom, id);

        Assert.Equal(3, preview.GetProperty("placements").GetInt32());
        Assert.Equal(1, preview.GetProperty("invitations").GetInt32());
        var look = preview.GetProperty("needLook").EnumerateArray().Select(r => $"{r.GetProperty("row").GetInt32()} {r.GetProperty("reason").GetString()}").ToList();
        Assert.Contains("3 Youth accounts are for ages 12 to 18; not invited", look);
        Assert.Contains("4 No cohort called “Drama Club”; imported, not placed", look);
        Assert.Contains("5 Used on row 2; not invited", look);
        Assert.Contains("6 Add a date of birth to invite; not invited", look);
        Assert.Contains("7 No cohort called “Kids Club”; imported, not placed", look);
        Assert.Contains("7 Tom Nguyen already has access; not invited", look);
    }

    [Fact]
    public async Task Running_places_each_child_in_its_cohort_invites_the_youth_once_and_audits_both()
    {
        var id = await UploadId(Tom, Csv);
        await Map(Tom, id);

        var summary = await Run(Tom, id);

        Assert.Equal(6, summary.GetProperty("imported").GetInt32());
        Assert.Equal(3, summary.GetProperty("enrolled").GetInt32());
        Assert.Equal(1, summary.GetProperty("invited").GetInt32());
        Assert.Equal([4, 7], summary.GetProperty("notPlaced").EnumerateArray().Select(r => r.GetProperty("row").GetInt32()));
        Assert.Equal([3, 5, 6, 7], summary.GetProperty("notInvited").EnumerateArray().Select(r => r.GetProperty("row").GetInt32()));
        Assert.Equal(["Ava Chen|After-School Tutoring", "Leo Chen|Saturday Sports", "Noa Kim|After-School Tutoring"],
            Query("SELECT c.FirstName || ' ' || c.LastName, p.Name FROM Enrollments e JOIN Children c ON c.Id = e.ChildId JOIN Programs p ON p.Id = e.ProgramId WHERE c.LastName IN ('Chen', 'Kim') ORDER BY c.FirstName"));
        Assert.Equal(["ava.chen@example.com|Youth"], Query("SELECT i.Email, i.Role FROM StaffInvitations i JOIN Children c ON c.Id = i.ChildId WHERE c.FirstName = 'Ava'"));
        Assert.Contains(_factory.Services.GetRequiredService<FakeEmailSender>().Sent, e => e.To == "ava.chen@example.com");
        Assert.Contains(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Import'"), s => s.Contains("3 placed in cohorts, 1 youth invited", StringComparison.Ordinal));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'StaffInvitation'"));
    }

    [Fact]
    public async Task Running_the_same_file_again_duplicates_no_child_enrollment_or_invitation()
    {
        const string dated = "Student,DOB,Parent,Cell,Group,Youth email\nAva Chen,2012-04-02,Mei Chen,905-555-0201,After-School Tutoring,ava.chen@example.com\n";
        var first = await UploadId(Tom, dated);
        await Map(Tom, first);
        await Run(Tom, first);

        var again = await UploadId(Tom, dated);
        var preview = await Map(Tom, again);
        var summary = await Run(Tom, again, merge: [2]);

        Assert.Equal(0, preview.GetProperty("invitations").GetInt32());
        Assert.Equal(0, summary.GetProperty("enrolled").GetInt32());
        Assert.Equal(0, summary.GetProperty("invited").GetInt32());
        Assert.Equal("An invitation is already waiting; not invited again", summary.GetProperty("notInvited")[0].GetProperty("reason").GetString());
        Assert.Single(Query("SELECT Id FROM Children WHERE FirstName = 'Ava'"));
        Assert.Single(Query("SELECT e.Id FROM Enrollments e JOIN Children c ON c.Id = e.ChildId WHERE c.FirstName = 'Ava'"));
        Assert.Single(Query("SELECT Id FROM StaffInvitations WHERE Email = 'ava.chen@example.com'"));
    }

    [Fact]
    public async Task A_youth_email_column_is_refused_while_Learning_is_off_or_for_a_program_director()
    {
        var byMarisol = await UploadId(Marisol, Csv);
        var refused = await _factory.ClientFor(Marisol).PutAsJsonAsync($"/imports/{byMarisol}/mapping", new { mapping = Mapping(), programId = (Guid?)null });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal("Only an admin sends youth invitations.", (await Errors(refused)).GetProperty("YouthEmail").GetString());

        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "Reports", "Mentoring" } })).IsSuccessStatusCode);
        var id = await UploadId(Tom, Csv);
        var off = await _factory.ClientFor(Tom).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping = Mapping(), programId = (Guid?)null });

        Assert.Equal("Youth invitations need Learning, which is off.", (await Errors(off)).GetProperty("YouthEmail").GetString());
        var cohortsOnly = Mapping();
        cohortsOnly["Youth email"] = "Skip";
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping = cohortsOnly, programId = (Guid?)null })).StatusCode);
    }

    [Fact]
    public async Task A_row_without_a_cohort_goes_to_the_program_chosen_for_everyone()
    {
        const string csv = "Student,DOB,Parent,Cell,Group\nAva Chen,2016-04-02,Mei Chen,905-555-0201,\nLeo Chen,2018-09-15,Mei Chen,905-555-0201,After-School Tutoring\n";
        var id = await UploadId(Tom, csv);
        var mapping = new Dictionary<string, string> { ["Student"] = "ChildName", ["DOB"] = "DateOfBirth", ["Parent"] = "GuardianName", ["Cell"] = "GuardianPhone", ["Group"] = "Cohort" };
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping, programId = Sports })).StatusCode);

        await Run(Tom, id);

        Assert.Equal(["Ava|Saturday Sports", "Leo|After-School Tutoring"],
            Query("SELECT c.FirstName, p.Name FROM Enrollments e JOIN Children c ON c.Id = e.ChildId JOIN Programs p ON p.Id = e.ProgramId WHERE c.LastName = 'Chen' ORDER BY c.FirstName"));
    }

    private static Dictionary<string, string> Mapping() => new()
    {
        ["Student"] = "ChildName",
        ["DOB"] = "DateOfBirth",
        ["Parent"] = "GuardianName",
        ["Cell"] = "GuardianPhone",
        ["Group"] = "Cohort",
        ["Youth email"] = "YouthEmail",
    };

    private async Task<JsonElement> Map(Guid who, Guid id)
    {
        var response = await _factory.ClientFor(who).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping = Mapping(), programId = (Guid?)null });
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"mapping answered {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<JsonElement> Run(Guid who, Guid id, int[]? merge = null)
    {
        var response = await _factory.ClientFor(who).PostAsJsonAsync($"/imports/{id}/run", new { merge = merge ?? [] });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private Task<HttpResponseMessage> Upload(Guid who, string csv)
    {
        var file = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
        file.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        return _factory.ClientFor(who).PostAsync("/imports", new MultipartFormDataContent { { file, "file", "harbourview-roster.csv" } });
    }

    private async Task<Guid> UploadId(Guid who, string csv) =>
        (await (await Upload(who, csv)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

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

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
