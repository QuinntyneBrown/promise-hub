using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application;
using PromiseHub.Application.LearningBond;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-160: the agent talks to the model with the household's language, first names, ages, statuses and computed figures only; its tools are
// read-only and authorized against the link's household; a slow, failing or unusable model leaves the approved fixed line; a SIN typed into
// the chat never reaches the model; amounts are only the rules'; the conversation is the household's own.
public sealed class LearningBondAgentTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;

    private FakeLanguageModel Model => _factory.Services.GetRequiredService<FakeLanguageModel>();

    // L2-160 criterion 6, L2-163: the fixed line first; the model's answer replaces it, in the household's language.
    [Fact]
    public async Task The_models_answer_replaces_the_fixed_line()
    {
        var answer = await Ask(new { step = "Landing" });

        Assert.StartsWith("El Bono de Estudios Canadiense es dinero", answer.GetProperty("fixed").GetString(), StringComparison.Ordinal);
        Assert.Equal("Hola, Carmen. Le explico este paso.", answer.GetProperty("reply").GetString());
        Assert.Equal("model", answer.GetProperty("source").GetString());
        Assert.Equal("es", Model.Requests[^1].Language);
    }

    // L2-160 criterion 4: slow (past the timeout) or failing, the fixed line stays and nothing breaks.
    [Fact]
    public async Task A_slow_or_failing_model_leaves_the_fixed_line()
    {
        Model.Slow = true;
        var slow = await Ask(new { step = "Consent" });
        Model.Slow = false;
        Model.Fail = true;
        var failed = await Ask(new { step = "Consent" });

        Assert.Equal(JsonValueKind.Null, slow.GetProperty("reply").ValueKind);
        Assert.Equal("fixed", slow.GetProperty("source").GetString());
        Assert.Equal(JsonValueKind.Null, failed.GetProperty("reply").ValueKind);
        Assert.StartsWith("Antes de preguntar nada", failed.GetProperty("fixed").GetString(), StringComparison.Ordinal);
    }

    // L2-160 criterion 1: names, ages, statuses and computed figures; never a SIN, a birth date, an address, a phone, an email or an answer.
    [Fact]
    public async Task What_goes_to_the_model_holds_no_personal_or_financial_detail()
    {
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");

        await Ask(new { step = "Submitted", message = "¿Cuándo llega el dinero?" });

        var sent = Model.Sent;
        Assert.Contains("Mateo", sent, StringComparison.Ordinal);
        Assert.Contains("Submitted", sent, StringComparison.Ordinal);
        Assert.Contains("1400", sent, StringComparison.Ordinal);
        foreach (var never in new[] { "276543212", "276 543 212", "345 123 459", "345123459", "2017-03-14", "905-555-0142", "carmen.rivera@example.com", "Barton", "taxFiled" })
        {
            Assert.DoesNotContain(never, sent, StringComparison.Ordinal);
        }
    }

    // L2-160 criterion 1, L2-159: a SIN typed into the chat is refused and never sent; what is kept has it removed.
    [Fact]
    public async Task A_SIN_in_the_chat_is_refused_and_never_reaches_the_model()
    {
        var before = Model.Requests.Count;

        var answer = await Ask(new { step = "Intake", message = "Mi número es 276 543 212" });

        Assert.Equal(before, Model.Requests.Count);
        Assert.Equal("Por favor, no escriba su SIN aquí. Va solo en la casilla del formulario.", answer.GetProperty("reply").GetString());
        var conversation = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/agent/conversation"));
        Assert.DoesNotContain("276", conversation.ToString(), StringComparison.Ordinal);
        Assert.Contains("[número eliminado]", conversation.ToString(), StringComparison.Ordinal);
    }

    // L2-160 criterion 2: five read-only tools, each for the link's household only.
    [Fact]
    public async Task The_tools_are_read_only_and_answer_only_for_the_links_household()
    {
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
        Model.ToolCalls.Add(new LanguageModelToolCall("GetEstimate", new Dictionary<string, string> { ["child"] = "Mateo" }));
        Model.ToolCalls.Add(new LanguageModelToolCall("GetEstimate", new Dictionary<string, string> { ["child"] = "Yusuf" }));
        Model.ToolCalls.Add(new LanguageModelToolCall("Submit", new Dictionary<string, string> { ["child"] = "Mateo" }));

        await Ask(new { step = "Estimate", message = "Envíe la solicitud por mí" });

        Assert.Equal(["GetStatus", "GetEstimate", "ListBenefits", "ExplainStep", "OfferCallback"], Model.Requests[^1].Tools.Select(t => t.Name));
        Assert.Contains("1400", Model.ToolResults[0], StringComparison.Ordinal);
        Assert.Equal("Not found.", Model.ToolResults[1]);
        Assert.Equal("No such tool.", Model.ToolResults[2]);
        Assert.Single(_factory.Services.GetRequiredService<FakeRespProviderChannel>().Submissions);
    }

    // L2-160 criterion 3: an amount no rule produced, or a reply too long, is never shown.
    [Fact]
    public async Task An_amount_no_rule_produced_or_a_long_reply_falls_back_to_the_fixed_line()
    {
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
        Model.Reply = "Mateo podría recibir $5,000.";
        var invented = await Ask(new { step = "Estimate" });
        Model.Reply = "Mateo podría recibir hasta $1,400.";
        var computed = await Ask(new { step = "Estimate" });
        Model.Reply = string.Join(' ', Enumerable.Repeat("palabra", 61));
        var tooLong = await Ask(new { step = "Estimate" });

        Assert.Equal("fixed", invented.GetProperty("source").GetString());
        Assert.Equal("model", computed.GetProperty("source").GetString());
        Assert.Equal("fixed", tooLong.GetProperty("source").GetString());
    }

    // L2-160 criterion 6: the conversation is the household's own.
    [Fact]
    public async Task The_conversation_is_read_by_the_household_only()
    {
        await Ask(new { step = "Landing", message = "¿Cuesta algo?" });
        var linh = await new LearningBondGuardianClient(_factory).OpenAsync("Tran", "905-555-0163");

        var mine = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/agent/conversation"));
        var theirs = await linh.Http.GetFromJsonAsync<JsonElement>(linh.Path("/agent/conversation"));

        Assert.Equal(["Guardian|¿Cuesta algo?", "Agent|Hola, Carmen. Le explico este paso."],
            mine.GetProperty("messages").EnumerateArray().Select(m => $"{m.GetProperty("role").GetString()}|{m.GetProperty("text").GetString()}"));
        Assert.Empty(theirs.GetProperty("messages").EnumerateArray());
    }

    // L2-162: an unknown link has expired (410), as on every guardian route; with the module off the agent and the conversation answer 404.
    [Fact]
    public async Task With_the_module_off_the_agent_answers_404_and_an_unknown_link_has_expired()
    {
        var wrong = await _carmen.Http.PostAsJsonAsync("/g/learning-bond/not-a-link/agent", new { step = "Landing" });
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages" } });

        Assert.Equal(HttpStatusCode.Gone, wrong.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _carmen.Http.PostAsJsonAsync(_carmen.Path("/agent"), new { step = "Landing" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _carmen.Http.GetAsync(_carmen.Path("/agent/conversation"))).StatusCode);
    }

    // Multi-tenant: the conversation belongs to the household's organization; another organization never reads it.
    [Fact]
    public async Task Another_organization_never_reads_the_conversation()
    {
        await Ask(new { step = "Landing", message = "¿Cuesta algo?" });

        Assert.Equal(2, await CountFor(DatabaseSeeder.Harbourview));
        Assert.Equal(0, await CountFor(DatabaseSeeder.Northgate));
    }

    // L2-161: each reply and tool call is audited by step and tool name, never by what was said.
    [Fact]
    public async Task Replies_and_tool_calls_are_audited_without_their_words()
    {
        Model.ToolCalls.Add(new LanguageModelToolCall("GetEstimate", new Dictionary<string, string> { ["child"] = "Mateo" }));
        Model.ToolCalls.Add(new LanguageModelToolCall("Submit", new Dictionary<string, string>()));

        await Ask(new { step = "Estimate", message = "¿Cuánto recibe Mateo?" });

        Assert.Equal("Learning Bond agent replied on Estimate (model)|Learning Bond agent tool GetEstimate|Learning Bond agent tool refused: Submit",
            Scalar("SELECT group_concat(Summary, '|') FROM (SELECT Summary FROM AuditEntries WHERE RecordType = 'LearningBondAgentMessage' ORDER BY Summary)"));
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM AuditEntries WHERE Summary LIKE '%Cuánto%'"));
    }

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private async Task<int> CountFor(Guid organizationId)
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
        return await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().LearningBondAgentMessages.CountAsync();
    }

    private async Task<JsonElement> Ask(object body)
    {
        var response = await _carmen.Http.PostAsJsonAsync(_carmen.Path("/agent"), body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task InitializeAsync() => _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
