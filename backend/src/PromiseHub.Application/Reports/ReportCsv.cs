using System.Globalization;

namespace PromiseHub.Application.Reports;

/// <summary>Writes CSV lines: a value with a comma, a quote or a line break is quoted, with its quotes doubled.</summary>
public static class ReportCsv
{
    public static string Line(params string?[] values) => string.Join(',', values.Select(Field));

    public static string Number(int? value) => value?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;

    private static string Field(string? value)
    {
        var text = value ?? string.Empty;
        return text.IndexOfAny([',', '"', '\n', '\r']) >= 0 ? $"\"{text.Replace("\"", "\"\"", StringComparison.Ordinal)}\"" : text;
    }
}
