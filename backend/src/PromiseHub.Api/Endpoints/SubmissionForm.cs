using Microsoft.AspNetCore.Http.Features;
using PromiseHub.Application.Learning;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Api.Endpoints;

/// <summary>Reads a submission's multipart form (text, link, attest, removeFile, file) into <see cref="SubmissionWork"/>; no rules live here.</summary>
public static class SubmissionForm
{
    private const long Overhead = 64 * 1024;
    public const long MaximumBody = AssignmentSubmission.MaximumFileBytes + Overhead;

    /// <summary>The work, or null when the body is not a readable multipart form within the size limit.</summary>
    public static async Task<SubmissionWork?> ReadAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType || request.ContentLength > MaximumBody)
        {
            return null;
        }
        IFormCollection form;
        try
        {
            form = await request.ReadFormAsync(new FormOptions { MultipartBodyLengthLimit = MaximumBody }, cancellationToken);
        }
        catch (InvalidDataException)
        {
            return null;
        }
        var file = form.Files.GetFile("file");
        return new SubmissionWork(form["text"].FirstOrDefault(), form["link"].FirstOrDefault(), IsTrue(form["attest"].FirstOrDefault()),
            file is null ? null : new SubmissionUpload(file.FileName, file.ContentType, file.Length, file.OpenReadStream()),
            IsTrue(form["removeFile"].FirstOrDefault()));
    }

    /// <summary>A body that could not be read: 422 on the file, as a refused file would be.</summary>
    public static IResult Refused() =>
        Results.Json(new { errors = new Dictionary<string, string> { ["file"] = "Choose a file of up to 10 MB." } }, statusCode: StatusCodes.Status422UnprocessableEntity);

    private static bool IsTrue(string? value) => string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
}
