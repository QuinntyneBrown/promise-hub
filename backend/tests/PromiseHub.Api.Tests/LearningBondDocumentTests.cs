using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-150 criterion 6: a requested document is uploaded through the link as a PDF, JPEG or PNG of up to 10 MB, kept encrypted, and sent to
// the provider only on Send, once.
public sealed class LearningBondDocumentTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly byte[] Pdf = Encoding.ASCII.GetBytes("%PDF-1.7 hydro bill October");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;
    private string _document = string.Empty;

    private FakeRespProviderChannel Channel => _factory.Services.GetRequiredService<FakeRespProviderChannel>();

    [Fact]
    public async Task An_uploaded_document_is_kept_encrypted_and_sent_once_only_on_Send()
    {
        var upload = await _carmen.Http.PostAsync(_carmen.Path($"/documents/{_document}/file"), Form(Pdf, "hydro-bill-oct.pdf", "application/pdf"));

        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
        Assert.Empty(Channel.Documents);
        var stored = Assert.Single(_factory.Services.GetRequiredService<FakeFileStore>().Files, f => f.Key.Contains(_document, StringComparison.Ordinal)).Value;
        Assert.NotEqual(Pdf, stored);
        Assert.DoesNotContain("hydro bill", Encoding.ASCII.GetString(stored), StringComparison.Ordinal);
        var progress = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        Assert.Equal("hydro-bill-oct.pdf", progress.GetProperty("document").GetProperty("fileName").GetString());

        var sent = await _carmen.Http.PostAsync(_carmen.Path($"/documents/{_document}/send"), null);
        var again = await _carmen.Http.PostAsync(_carmen.Path($"/documents/{_document}/send"), null);

        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, again.StatusCode);
        var document = Assert.Single(Channel.Documents);
        Assert.Equal(Pdf, document.Content);
        Assert.Equal("Northfield Credit Union", document.Provider);
        var after = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        Assert.Equal(JsonValueKind.Null, after.GetProperty("document").ValueKind);
    }

    [Fact]
    public async Task A_file_that_is_not_a_PDF_JPEG_or_PNG_or_is_over_10_MB_is_refused_and_Send_needs_a_file()
    {
        var text = await _carmen.Http.PostAsync(_carmen.Path($"/documents/{_document}/file"), Form(Pdf, "notes.txt", "text/plain"));
        var big = await _carmen.Http.PostAsync(_carmen.Path($"/documents/{_document}/file"), Form(new byte[14 * 1024 * 1024], "scan.png", "image/png"));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, text.StatusCode);
        Assert.Equal("Choose a PDF, JPEG or PNG up to 10 MB.", (await text.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("file").GetString());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, big.StatusCode);
        Assert.Equal("That file is 14 MB. Choose a PDF, JPEG or PNG up to 10 MB.", (await big.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("file").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await _carmen.Http.PostAsync(_carmen.Path($"/documents/{_document}/send"), null)).StatusCode);
        Assert.Empty(Channel.Documents);
    }

    [Fact]
    public async Task Another_households_link_cannot_upload_or_send_the_document()
    {
        var linh = await new LearningBondGuardianClient(_factory).OpenAsync("Tran", "905-555-0163");

        Assert.Equal(HttpStatusCode.NotFound, (await linh.Http.PostAsync(linh.Path($"/documents/{_document}/file"), Form(Pdf, "bill.pdf", "application/pdf"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await linh.Http.PostAsync(linh.Path($"/documents/{_document}/send"), null)).StatusCode);
    }

    private static MultipartFormDataContent Form(byte[] bytes, string name, string type)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(type);
        return new MultipartFormDataContent { { file, "file", name } };
    }

    public async Task InitializeAsync()
    {
        _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
        var body = JsonSerializer.Serialize(new { eventId = "evt-doc", reference = "NCU-0001", kind = "DocumentNeeded", documentName = "proof of address" });
        var signature = Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(ApiFactoryBase.NorthfieldWebhookSecret), Encoding.UTF8.GetBytes(body)));
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        content.Headers.Add("X-PromiseHub-Signature", $"sha256={signature}");
        Assert.Equal(HttpStatusCode.OK, (await _factory.CreateClient().PostAsync("/learning-bond/webhooks/providers/northfield", content)).StatusCode);
        var progress = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        _document = progress.GetProperty("document").GetProperty("id").GetString()!;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
