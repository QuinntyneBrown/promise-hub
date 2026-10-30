using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-153 to L2-156: the benefits check has its own consent; its intake reuses the Learning Bond answers and asks at most three facts; the
// catalogue's rules compute each benefit's state and estimate on the server; each application is sent on its own, once, only on Submit.
public sealed class LearningBondBenefitsTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;

    private FakeBenefitChannel Channel => _factory.Services.GetRequiredService<FakeBenefitChannel>();

    // L2-153 criteria 1 to 3.
    [Fact]
    public async Task The_offer_is_remembered_and_nothing_about_benefits_answers_before_its_own_consent()
    {
        var page = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/page"));
        Assert.True(page.GetProperty("benefits").GetProperty("offered").GetBoolean());
        Assert.Equal(HttpStatusCode.NoContent, (await _carmen.Http.PostAsync(_carmen.Path("/benefits/offer/dismiss"), null)).StatusCode);
        var progress = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        Assert.False(progress.GetProperty("benefitsOffer").GetBoolean());
        Assert.True((await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/page"))).GetProperty("benefits").GetProperty("offered").GetBoolean());

        Assert.Equal(HttpStatusCode.Forbidden, (await _carmen.Http.GetAsync(_carmen.Path("/benefits"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _carmen.Http.GetAsync(_carmen.Path("/benefits/intake"))).StatusCode);
        var consent = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits/consent"));
        // The Riveras read it in Spanish, their household language.
        Assert.Equal("Acepto que Learning Bond use lo que ya di, más el tamaño de mi hogar, mi estado civil y si recibo el Beneficio por Hijos de Canadá, para revisar y solicitar los beneficios por hijos que yo elija.",
            consent.GetProperty("wording").GetString());

        var given = await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { scope = "Benefits", typedName = "Carmen Rivera" });

        Assert.Equal(HttpStatusCode.Created, given.StatusCode);
        Assert.Equal("Benefits|Benefits", Scalar("SELECT GROUP_CONCAT(Scope, '|') FROM LearningBondConsents WHERE Scope = 'Benefits'"));
        Assert.Equal(HttpStatusCode.OK, (await _carmen.Http.GetAsync(_carmen.Path("/benefits/intake"))).StatusCode);
        // A Benefits consent never counts as a Learning Bond one: Sofía still has no claim.
        Assert.Equal(HttpStatusCode.Forbidden, (await _carmen.Http.GetAsync(_carmen.Path($"/children/{Sofia}/intake"))).StatusCode);
    }

    // L2-154 criteria 1 to 4.
    [Fact]
    public async Task The_intake_asks_three_facts_validates_them_and_stops_for_a_child_nobody_is_sure_who_claims()
    {
        await Consent();
        var intake = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits/intake"));
        Assert.Equal(["Mateo", "Sofía"], intake.GetProperty("children").EnumerateArray().Select(c => c.GetProperty("firstName").GetString()!));
        Assert.True(intake.GetProperty("sinGiven").GetBoolean());

        var bad = await _carmen.Http.PutAsJsonAsync(_carmen.Path("/benefits/intake"), new { householdSize = 22, maritalStatus = "Engaged", ccbNow = "" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, bad.StatusCode);
        var errors = (await bad.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter how many people live with you, from 1 to 15.", errors.GetProperty("householdSize").GetString());
        Assert.Equal("Choose one.", errors.GetProperty("maritalStatus").GetString());
        Assert.Equal("Choose one.", errors.GetProperty("ccbNow").GetString());

        var saved = await _carmen.Http.PutAsJsonAsync(_carmen.Path("/benefits/intake"), new
        {
            householdSize = 3,
            maritalStatus = "Separated",
            ccbNow = "Yes",
            incomeChanged = "Yes",
            custody = new Dictionary<string, string> { [Mateo.ToString()] = "Me", [Sofia.ToString()] = "NotSure" },
        });
        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.DoesNotContain("Separated", Scalar("SELECT AnswersCiphertext FROM LearningBondBenefitsChecks"), StringComparison.Ordinal);

        var benefits = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits"));
        Assert.Equal(["We can’t check benefits for Sofía until it’s clear who claims them. Staff can help."],
            benefits.GetProperty("blocked").EnumerateArray().Select(b => b.GetString()!));
        Assert.Equal("These estimates use your last tax return. A big change this year can change them.", benefits.GetProperty("incomeNote").GetString());
    }

    // L2-155 criteria 1, 2 and 5, L2-156 criterion 1.
    [Fact]
    public async Task Each_benefit_has_one_state_and_an_estimate_from_the_catalogue_rules()
    {
        await Consent();
        await Intake();

        var benefits = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits"));

        var items = benefits.GetProperty("benefits").EnumerateArray().ToDictionary(b => b.GetProperty("key").GetString()!);
        Assert.Equal("ApplyNow|Provincial|1680", Describe(items["ontario-child-benefit"]));
        Assert.Equal("NeedDocument|Municipal|", Describe(items["hamilton-recreation-assistance"]));
        Assert.Equal("proof of address", items["hamilton-recreation-assistance"].GetProperty("document").GetString());
        Assert.Equal("NotEligible|Federal|6822", Describe(items["child-disability-benefit"]));
        Assert.Equal("AlreadyGet|Federal|13496", Describe(items["canada-child-benefit"]));
        Assert.Equal("2026-07", items["ontario-child-benefit"].GetProperty("ruleVersion").GetString());
        Assert.StartsWith("https://", items["ontario-child-benefit"].GetProperty("sourceLink").GetString(), StringComparison.Ordinal);
        Assert.DoesNotContain(items.Keys, k => k.StartsWith("bc-", StringComparison.Ordinal));
        Assert.Equal(JsonValueKind.Null, benefits.GetProperty("localNote").ValueKind);
    }

    // L2-155 criterion 3.
    [Fact]
    public async Task A_city_with_no_local_programs_gets_federal_and_provincial_only_and_says_so()
    {
        await Consent();
        await Intake();
        Execute("UPDATE Organizations SET City = 'Burlington, Ontario' WHERE Name = 'Harbourview Youth Collective'");

        var benefits = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits"));

        Assert.Equal("We don’t know local programs for Burlington yet.", benefits.GetProperty("localNote").GetString());
        Assert.DoesNotContain(benefits.GetProperty("benefits").EnumerateArray(), b => b.GetProperty("level").GetString() == "Municipal");
    }

    // L2-156 criteria 2 and 3, L2-149: one benefit, one submission, once, only on Submit.
    [Fact]
    public async Task Apply_now_prefills_one_application_and_Submit_sends_only_that_one_once()
    {
        await Consent();
        await Intake();

        var review = await (await _carmen.Http.PostAsync(_carmen.Path("/benefits/ontario-child-benefit/applications"), null)).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Ontario Child Benefit", review.GetProperty("program").GetString());
        Assert.Equal("212", review.GetProperty("fields").GetProperty("applicantSin").GetString());
        Assert.Equal("3", review.GetProperty("fields").GetProperty("householdSize").GetString());
        Assert.Empty(Channel.Submissions);
        var id = review.GetProperty("id").GetString();
        var version = (await (await _carmen.Http.PatchAsJsonAsync(_carmen.Path($"/benefits/applications/{id}/fields/address"), new { value = "42 Barton St E, Hamilton ON L8L 2V6" }))
            .Content.ReadFromJsonAsync<JsonElement>()).GetProperty("reviewVersion").GetInt32();

        var sent = await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/benefits/applications/{id}/submit"), new { reviewVersion = version });
        var again = await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/benefits/applications/{id}/submit"), new { reviewVersion = version });

        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, again.StatusCode);
        var submission = Assert.Single(Channel.Submissions);
        Assert.Equal("ontario-child-benefit", submission.BenefitKey);
        Assert.Equal("276543212", submission.ApplicantSin);
        Assert.Equal("Guardian|Benefit application submitted: Ontario Child Benefit",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Submitted' AND RecordType = 'LearningBondBenefitApplication'"));
        var after = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits"));
        Assert.Equal("Submitted", after.GetProperty("benefits").EnumerateArray().Single(b => b.GetProperty("key").GetString() == "ontario-child-benefit").GetProperty("state").GetString());
    }

    // L2-156 criteria 2 and 5: a document first, then a form the guardian sends themselves; marking it sent is their act.
    [Fact]
    public async Task A_form_benefit_takes_its_document_offers_the_filled_PDF_and_is_marked_sent_by_the_guardian()
    {
        await Consent();
        await Intake();
        var file = new ByteArrayContent(Encoding.ASCII.GetBytes("%PDF-1.7 hydro bill"));
        file.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

        var upload = await _carmen.Http.PostAsync(_carmen.Path("/benefits/hamilton-recreation-assistance/document"), new MultipartFormDataContent { { file, "file", "hydro-bill-oct.pdf" } });

        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
        var item = (await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/benefits"))).GetProperty("benefits").EnumerateArray()
            .Single(b => b.GetProperty("key").GetString() == "hamilton-recreation-assistance");
        Assert.Equal("ApplyNow", item.GetProperty("state").GetString());
        Assert.Equal("hydro-bill-oct.pdf", item.GetProperty("documentFile").GetString());
        var review = await (await _carmen.Http.PostAsync(_carmen.Path("/benefits/hamilton-recreation-assistance/applications"), null)).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Form", review.GetProperty("channel").GetString());
        var id = review.GetProperty("id").GetString();

        var pdf = await _carmen.Http.GetAsync(_carmen.Path($"/benefits/applications/{id}/form"));

        Assert.Equal("application/pdf", pdf.Content.Headers.ContentType?.MediaType);
        var text = Encoding.Latin1.GetString(await pdf.Content.ReadAsByteArrayAsync());
        Assert.StartsWith("%PDF-", text, StringComparison.Ordinal);
        Assert.Contains("Carmen Rivera", text, StringComparison.Ordinal);
        Assert.DoesNotContain("276543212", text, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Conflict, (await _carmen.Http.PostAsJsonAsync(_carmen.Path($"/benefits/applications/{id}/submit"), new { reviewVersion = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _carmen.Http.PostAsync(_carmen.Path($"/benefits/applications/{id}/sent"), null)).StatusCode);
        Assert.Empty(Channel.Submissions);
        Assert.Equal("MarkedSent", Scalar("SELECT Status FROM LearningBondBenefitApplications"));
    }

    // L2-153 criterion 3, L2-162: another household's link sees nothing of this household's benefits.
    [Fact]
    public async Task Another_households_link_reaches_none_of_this_households_benefit_applications()
    {
        await Consent();
        await Intake();
        var id = (await (await _carmen.Http.PostAsync(_carmen.Path("/benefits/ontario-child-benefit/applications"), null)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        var linh = await new LearningBondGuardianClient(_factory).OpenAsync("Tran", "905-555-0163");
        await linh.Http.PostAsJsonAsync(linh.Path("/consents"), new { scope = "Benefits", typedName = "Linh Tran" });

        Assert.Equal(HttpStatusCode.NotFound, (await linh.Http.PostAsJsonAsync(linh.Path($"/benefits/applications/{id}/submit"), new { reviewVersion = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await linh.Http.GetAsync(linh.Path($"/benefits/applications/{id}/form"))).StatusCode);
    }

    private static string Describe(JsonElement b) =>
        $"{b.GetProperty("state").GetString()}|{b.GetProperty("level").GetString()}|{(b.GetProperty("amount").ValueKind == JsonValueKind.Null ? "" : b.GetProperty("amount").GetInt32())}";

    private async Task Consent() =>
        Assert.Equal(HttpStatusCode.Created, (await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { scope = "Benefits", typedName = "Carmen Rivera" })).StatusCode);

    private async Task Intake() =>
        Assert.Equal(HttpStatusCode.NoContent, (await _carmen.Http.PutAsJsonAsync(_carmen.Path("/benefits/intake"),
            new { householdSize = 3, maritalStatus = "Single", ccbNow = "Yes", incomeChanged = "No" })).StatusCode);

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public async Task InitializeAsync()
    {
        _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
