using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Which files a submission accepts (L2-077 criterion 4, L2-031, ADR 0056): a JPG or PNG photo where Photo is allowed, a PDF, JPG or PNG
/// file where File is allowed, 1 byte to 10 MB, with extension, content type and first bytes in agreement.
/// </summary>
public static class SubmissionFilePolicy
{
    private static readonly Dictionary<string, string> Types = new(StringComparer.OrdinalIgnoreCase)
    {
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".pdf"] = "application/pdf",
    };

    public static bool TakesFiles(SubmissionTypes types) => types.HasFlag(SubmissionTypes.Photo) || types.HasFlag(SubmissionTypes.File);

    /// <summary>What to tell a youth whose file is refused.</summary>
    public static string Refusal(SubmissionTypes types) =>
        types.HasFlag(SubmissionTypes.File) ? "Choose a PDF, JPG or PNG file of up to 10 MB." : "Choose a JPG or PNG photo of up to 10 MB.";

    /// <summary>The kind, content type and lowercase extension to store the file under, or null when it is refused.</summary>
    public static (SubmissionFileKind Kind, string ContentType, string Extension)? Accept(string fileName, string? contentType, long length, ReadOnlySpan<byte> head, SubmissionTypes types)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (length < 1 || length > AssignmentSubmission.MaximumFileBytes || !Types.TryGetValue(extension, out var type)
            || contentType is null || !string.Equals(contentType.Split(';')[0].Trim(), type, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }
        var signed = type switch
        {
            "image/png" => head.Length >= 8 && head[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            "image/jpeg" => head.Length >= 3 && head[0] == 0xFF && head[1] == 0xD8 && head[2] == 0xFF,
            _ => head.Length >= 5 && head[..5].SequenceEqual("%PDF-"u8),
        };
        if (!signed)
        {
            return null;
        }
        if (type != "application/pdf" && types.HasFlag(SubmissionTypes.Photo))
        {
            return (SubmissionFileKind.Photo, type, extension == ".jpeg" ? ".jpg" : extension);
        }
        return types.HasFlag(SubmissionTypes.File) ? (SubmissionFileKind.File, type, extension == ".jpeg" ? ".jpg" : extension) : null;
    }
}
