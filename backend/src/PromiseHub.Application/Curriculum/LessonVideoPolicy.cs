namespace PromiseHub.Application.Curriculum;

/// <summary>An MP4, MOV or WebM video by extension, content type and first bytes, of 1 byte up to the configured size (L2-067 criterion 8, L2-031).</summary>
public static class LessonVideoPolicy
{
    public const string Refusal = "Choose an MP4, MOV or WebM video of up to 1 GB.";

    private static readonly Dictionary<string, string[]> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".mp4"] = ["video/mp4"],
        [".mov"] = ["video/quicktime", "video/mp4"],
        [".webm"] = ["video/webm"],
    };

    /// <summary>The lowercase extension to store the file under, or null when the file is not an accepted video.</summary>
    public static string? Accept(string fileName, string? contentType, long length, long maxBytes, ReadOnlySpan<byte> head)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (length < 1 || length > maxBytes || !ContentTypes.TryGetValue(extension, out var types)
            || contentType is null || !types.Contains(contentType.Split(';')[0].Trim(), StringComparer.OrdinalIgnoreCase))
        {
            return null;
        }
        var signed = extension == ".webm"
            ? head.Length >= 4 && head[0] == 0x1A && head[1] == 0x45 && head[2] == 0xDF && head[3] == 0xA3
            : head.Length >= 8 && head[4] == (byte)'f' && head[5] == (byte)'t' && head[6] == (byte)'y' && head[7] == (byte)'p';
        return signed ? extension : null;
    }
}
