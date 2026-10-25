using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-010 roster import, L2-011 household and child records, L2-032 audit, L2-007 roles, L2-001 tenant isolation, L2-005 Roster off.
public sealed class ImportTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");

    private const string Csv =
        "Student,DOB,Parent,Cell,Email,Allergies/Meds,Lang,T-shirt\n" +
        "Ava Chen,2016-04-02,Mei Chen,905-555-0201,mei.chen@example.com,,English,S\n" +
        "Leo Chen,2018-09-15,Mei Chen,905-555-0201,mei.chen@example.com,Peanuts,English,XS\n" +
        "Mateo Rivera,2017-03-14,Carmen Rivera,905-555-0142,,,Spanish,M\n" +
        "Zoe Park,2015-01-20,Jin Park,,jin.park@example.com,,English,M\n" +
        "Sam Ortiz,2016-07-07,Rosa Ortiz,,,,English,L\n";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_uploaded_csv_is_matched_column_by_column_and_unmatched_ones_are_listed()
    {
        var upload = await Upload(Csv, "roster-fall-2026.csv");

        Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
        var body = await upload.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, body.GetProperty("rowCount").GetInt32());
        var columns = body.GetProperty("columns").EnumerateArray().ToDictionary(c => c.GetProperty("name").GetString()!, c => c);
        Assert.Equal("ChildName", columns["Student"].GetProperty("field").GetString());
        Assert.Equal("DateOfBirth", columns["DOB"].GetProperty("field").GetString());
        Assert.Equal("GuardianName", columns["Parent"].GetProperty("field").GetString());
        Assert.Equal("GuardianPhone", columns["Cell"].GetProperty("field").GetString());
        Assert.Equal("GuardianEmail", columns["Email"].GetProperty("field").GetString());
        Assert.Equal("Allergies", columns["Allergies/Meds"].GetProperty("field").GetString());
        Assert.Equal("Language", columns["Lang"].GetProperty("field").GetString());
        Assert.Equal(JsonValueKind.Null, columns["T-shirt"].GetProperty("field").ValueKind);
        Assert.Equal("Ava Chen", columns["Student"].GetProperty("sample").GetString());
    }

    [Fact]
    public async Task An_xlsx_file_reads_the_same_way()
    {
        var upload = await Upload(Xlsx([["Child name", "Parent", "Phone"], ["Ava Chen", "Mei Chen", "905-555-0201"]]), "roster.xlsx");

        Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
        var body = await upload.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, body.GetProperty("rowCount").GetInt32());
        Assert.Equal("ChildName", body.GetProperty("columns")[0].GetProperty("field").GetString());
    }

    [Fact]
    public async Task A_file_that_is_not_a_spreadsheet_is_refused_and_nothing_is_created()
    {
        var upload = await Upload([0x00, 0x01, 0x02, 0x50, 0xFF, 0x00], "roster-fall-2026.numbers");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, upload.StatusCode);
        Assert.Equal("We couldn’t read roster-fall-2026.numbers. Export it as CSV or XLSX and try again. Nothing was imported.",
            (await Errors(upload)).GetProperty("file").GetString());
        Assert.Empty(Query("SELECT Id FROM ImportSessions"));
    }

    [Fact]
    public async Task The_mapping_needs_a_child_name_a_guardian_and_a_way_to_reach_them()
    {
        var id = await UploadId();

        var response = await _factory.ClientFor(Tom).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping = new Dictionary<string, string> { ["Student"] = "ChildName" }, programId = (Guid?)null });

        var errors = await Errors(response);
        Assert.Equal("Map the guardian’s name.", errors.GetProperty("GuardianName").GetString());
        Assert.Equal("Map the guardian’s phone or email.", errors.GetProperty("GuardianContact").GetString());
    }

    [Fact]
    public async Task The_review_shows_duplicates_and_rows_that_need_a_look()
    {
        var id = await UploadId();

        var preview = await Map(id);

        Assert.Equal(5, preview.GetProperty("rows").GetInt32());
        var duplicate = Assert.Single(preview.GetProperty("duplicates").EnumerateArray());
        Assert.Equal(4, duplicate.GetProperty("row").GetInt32());
        Assert.Equal("Mateo Rivera", duplicate.GetProperty("child").GetString());
        var look = preview.GetProperty("needLook").EnumerateArray().ToList();
        Assert.Equal([5, 6], look.Select(r => r.GetProperty("row").GetInt32()));
        Assert.Equal("No mobile; email only", look[0].GetProperty("reason").GetString());
        Assert.Equal("No phone or email", look[1].GetProperty("reason").GetString());
    }

    [Fact]
    public async Task Running_the_import_creates_households_children_and_enrolments_in_one_audit_entry()
    {
        var id = await UploadId();
        await Map(id, Sports);

        var run = await _factory.ClientFor(Tom).PostAsJsonAsync($"/imports/{id}/run", new { merge = Array.Empty<int>() });

        Assert.Equal(HttpStatusCode.OK, run.StatusCode);
        var summary = await run.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, summary.GetProperty("rows").GetInt32());
        Assert.Equal(3, summary.GetProperty("imported").GetInt32());
        Assert.Equal(2, summary.GetProperty("familiesCreated").GetInt32());
        Assert.Equal(3, summary.GetProperty("children").GetInt32());
        Assert.Equal(1, summary.GetProperty("skipped").GetInt32());
        Assert.Equal(1, summary.GetProperty("needFix").GetInt32());
        Assert.Single(Query("SELECT Id FROM Households WHERE Name = 'Chen'"));
        Assert.Equal(2, Query("SELECT c.Id FROM Children c JOIN Households h ON h.Id = c.HouseholdId WHERE h.Name = 'Chen'").Count);
        Assert.Equal("Peanuts", Query("SELECT Allergies FROM Children WHERE FirstName = 'Leo'").Single());
        Assert.Single(Query("SELECT Id FROM Guardians WHERE Name = 'Jin Park' AND Mobile IS NULL"));
        Assert.Equal(3, Query($"SELECT e.Id FROM Enrollments e JOIN Children c ON c.Id = e.ChildId WHERE e.ProgramId = '{Sports.ToString().ToUpperInvariant()}' AND c.FirstName IN ('Ava', 'Leo', 'Zoe')").Count);
        Assert.Empty(Query("SELECT Id FROM Guardians WHERE Name = 'Rosa Ortiz'"));
        var audit = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'Import'"));
        Assert.Contains("roster-fall-2026.csv", audit, StringComparison.Ordinal);
        Assert.Contains("5 rows", audit, StringComparison.Ordinal);
        Assert.Contains("Tom Nguyen", audit, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Conflict, (await _factory.ClientFor(Tom).PostAsJsonAsync($"/imports/{id}/run", new { merge = Array.Empty<int>() })).StatusCode);
    }

    [Fact]
    public async Task A_returning_family_is_matched_by_phone_instead_of_duplicated_and_a_merged_duplicate_updates_the_child()
    {
        var id = await UploadId();
        await Map(id);

        var summary = await (await _factory.ClientFor(Tom).PostAsJsonAsync($"/imports/{id}/run", new { merge = new[] { 4 } })).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(1, summary.GetProperty("familiesUpdated").GetInt32());
        Assert.Equal(0, summary.GetProperty("skipped").GetInt32());
        Assert.Single(Query("SELECT Id FROM Households WHERE Name = 'Rivera' AND OrganizationId = '" + DatabaseSeeder.Harbourview.ToString().ToUpperInvariant() + "'"));
        Assert.Single(Query("SELECT Id FROM Children WHERE FirstName = 'Mateo' AND OrganizationId = '" + DatabaseSeeder.Harbourview.ToString().ToUpperInvariant() + "'"));
    }

    [Fact]
    public async Task Site_leads_cannot_import()
    {
        var response = await _factory.ClientFor(Jaylen).PostAsync("/imports", Form(Encoding.UTF8.GetBytes(Csv), "roster.csv"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Another_organizations_import_is_never_found_and_duplicates_are_only_matched_within_the_organization()
    {
        var id = await UploadId();
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping = new Dictionary<string, string>() })).StatusCode);

        var northgate = await _factory.ClientFor(Grace).PostAsync("/imports", Form(Encoding.UTF8.GetBytes("Student,DOB,Parent,Cell\nSofía Rivera,2014-06-02,Ana Rivera,289-555-0101\n"), "ng.csv"));
        var ngId = (await northgate.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var preview = await (await _factory.ClientFor(Grace).PutAsJsonAsync($"/imports/{ngId}/mapping", new { mapping = new Dictionary<string, string> { ["Student"] = "ChildName", ["DOB"] = "DateOfBirth", ["Parent"] = "GuardianName", ["Cell"] = "GuardianPhone" } })).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Empty(preview.GetProperty("duplicates").EnumerateArray());
    }

    [Fact]
    public async Task With_Roster_off_import_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await Upload(Csv, "roster.csv")).StatusCode);
    }

    private Task<HttpResponseMessage> Upload(string csv, string name) => Upload(Encoding.UTF8.GetBytes(csv), name);

    private Task<HttpResponseMessage> Upload(byte[] bytes, string name) => _factory.ClientFor(Tom).PostAsync("/imports", Form(bytes, name));

    private static MultipartFormDataContent Form(byte[] bytes, string name)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        return new MultipartFormDataContent { { file, "file", name } };
    }

    private async Task<Guid> UploadId() =>
        (await (await Upload(Csv, "roster-fall-2026.csv")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

    private async Task<JsonElement> Map(Guid id, Guid? programId = null)
    {
        var mapping = new Dictionary<string, string>
        {
            ["Student"] = "ChildName",
            ["DOB"] = "DateOfBirth",
            ["Parent"] = "GuardianName",
            ["Cell"] = "GuardianPhone",
            ["Email"] = "GuardianEmail",
            ["Allergies/Meds"] = "Allergies",
            ["Lang"] = "Language",
            ["T-shirt"] = "Skip",
        };
        var response = await _factory.ClientFor(Tom).PutAsJsonAsync($"/imports/{id}/mapping", new { mapping, programId });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    /// <summary>A minimal XLSX: one sheet of inline strings, as spreadsheet apps can write it.</summary>
    private static byte[] Xlsx(string[][] rows)
    {
        using var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            void Entry(string path, string xml)
            {
                using var writer = new StreamWriter(zip.CreateEntry(path).Open());
                writer.Write(xml);
            }
            Entry("[Content_Types].xml", "<?xml version=\"1.0\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"/>");
            Entry("xl/workbook.xml", "<?xml version=\"1.0\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheets><sheet name=\"Roster\" sheetId=\"1\"/></sheets></workbook>");
            var sheet = new StringBuilder("<?xml version=\"1.0\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
            for (var r = 0; r < rows.Length; r++)
            {
                sheet.Append($"<row r=\"{r + 1}\">");
                for (var c = 0; c < rows[r].Length; c++)
                {
                    sheet.Append($"<c r=\"{(char)('A' + c)}{r + 1}\" t=\"inlineStr\"><is><t>{rows[r][c]}</t></is></c>");
                }
                sheet.Append("</row>");
            }
            Entry("xl/worksheets/sheet1.xml", sheet.Append("</sheetData></worksheet>").ToString());
        }
        return stream.ToArray();
    }

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
