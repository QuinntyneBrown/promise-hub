using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Imports;

namespace PromiseHub.Application.Imports;

/// <summary>Turns a session's stored rows into mapped rows, and finds the duplicates and the rows that need a look.</summary>
public sealed class ImportRows(IPromiseHubDb db)
{
    public static Dictionary<string, ImportField> MappingOf(ImportSession session) =>
        JsonSerializer.Deserialize<Dictionary<string, ImportField>>(session.Mapping ?? "{}")!;

    public static List<ImportRow> Read(ImportSession session)
    {
        var headers = JsonSerializer.Deserialize<List<string>>(session.Headers)!;
        var rows = JsonSerializer.Deserialize<List<List<string>>>(session.Rows)!;
        var mapping = MappingOf(session);
        string? Value(List<string> row, ImportField field)
        {
            var column = mapping.FirstOrDefault(m => m.Value == field).Key;
            var index = column is null ? -1 : headers.IndexOf(column);
            var value = index >= 0 && index < row.Count ? row[index].Trim() : null;
            return string.IsNullOrEmpty(value) ? null : value;
        }
        return [.. rows.Select((row, i) => new ImportRow(
            i + 2,
            Value(row, ImportField.ChildName) ?? string.Empty,
            DateOnly.TryParse(Value(row, ImportField.DateOfBirth), CultureInfo.InvariantCulture, out var dob) ? dob : null,
            Value(row, ImportField.School),
            Value(row, ImportField.GuardianName),
            Value(row, ImportField.GuardianPhone),
            Value(row, ImportField.GuardianEmail),
            Value(row, ImportField.Allergies),
            Value(row, ImportField.Language),
            Value(row, ImportField.Notes)))];
    }

    /// <summary>Rows whose child already exists in this organization with the same name and date of birth.</summary>
    public async Task<Dictionary<int, Guid>> DuplicatesAsync(IEnumerable<ImportRow> rows, CancellationToken cancellationToken)
    {
        var existing = await db.Children.AsNoTracking().Select(c => new { c.Id, c.FirstName, c.LastName, c.DateOfBirth }).ToListAsync(cancellationToken);
        var found = new Dictionary<int, Guid>();
        foreach (var row in rows.Where(r => r.DateOfBirth is not null))
        {
            var match = existing.FirstOrDefault(c => c.DateOfBirth == row.DateOfBirth && Normal($"{c.FirstName} {c.LastName}") == Normal(row.ChildName));
            if (match is not null)
            {
                found[row.Line] = match.Id;
            }
        }
        return found;
    }

    public static string? Problem(ImportRow row) =>
        string.IsNullOrWhiteSpace(row.ChildName) ? "No child name"
        : row.Phone is null && row.Email is null ? "No phone or email"
        : row.Phone is null ? "No mobile; email only"
        : null;

    public static string Normal(string name) => string.Join(' ', name.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    public static string? Digits(string? phone) => phone is null ? null : ContactMask.Digits(phone);
}
