using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Imports;

namespace PromiseHub.Application.Imports;

/// <summary>Turns a session's stored rows into mapped rows, and finds the duplicates and the rows that need a look.</summary>
public sealed class ImportRows(IPromiseHubDb db, Mentoring.OrganizationToday today)
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
            Value(row, ImportField.Notes),
            Value(row, ImportField.Cohort),
            Value(row, ImportField.YouthEmail)?.ToLowerInvariant()))];
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

    /// <summary>The organization's active programs by normalised name, for the Cohort column (another organization's are never matched).</summary>
    public async Task<Dictionary<string, (Guid Id, string Name)>> CohortsAsync(CancellationToken cancellationToken)
    {
        var programs = await db.Programs.AsNoTracking().Where(p => p.Status == Domain.Programs.ProgramStatus.Active)
            .Select(p => new { p.Id, p.Name }).ToListAsync(cancellationToken);
        return programs.GroupBy(p => CohortKey(p.Name)).ToDictionary(g => g.Key, g => (g.First().Id, g.First().Name));
    }

    /// <summary>A cohort name without regard to case, spacing or hyphen style.</summary>
    public static string CohortKey(string name) =>
        Normal(new string([.. name.Select(c => c is '\u2010' or '\u2011' or '\u2012' or '\u2013' or '\u2014' or '\u2212' ? '-' : c)]));

    /// <summary>
    /// Why each row with a youth email is not invited, or null when it is (L2-130, L2-051): an email like name@example.org, once per file, a date
    /// of birth putting the child at 12 to 18, no youth account or waiting invitation for the existing child, and nobody with access by that email.
    /// </summary>
    public async Task<Dictionary<int, string?>> InvitationsAsync(IReadOnlyList<ImportRow> rows, IReadOnlyDictionary<int, Guid> existing, CancellationToken cancellationToken)
    {
        var result = new Dictionary<int, string?>();
        var candidates = rows.Where(r => r.YouthEmail is not null && Problem(r) is not ("No child name" or "No phone or email")).ToList();
        if (candidates.Count == 0)
        {
            return result;
        }
        var date = await today.GetAsync(cancellationToken);
        var emails = candidates.Select(r => r.YouthEmail!).Distinct().ToList();
        var access = (await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null && emails.Contains(m.Email)).Select(m => new { m.Email, m.PersonName })
            .ToListAsync(cancellationToken)).GroupBy(m => m.Email).ToDictionary(g => g.Key, g => g.First().PersonName);
        var childIds = existing.Values.ToList();
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);
        var accounts = (await db.Memberships.AsNoTracking().Where(m => m.ChildId != null && m.RemovedAt == null && childIds.Contains(m.ChildId!.Value))
            .Select(m => m.ChildId!.Value).ToListAsync(cancellationToken)).ToHashSet();
        var waiting = (await db.StaffInvitations.AsNoTracking().Where(i => i.ChildId != null && i.AcceptedAt == null && i.WithdrawnAt == null && childIds.Contains(i.ChildId!.Value))
            .Select(i => i.ChildId!.Value).ToListAsync(cancellationToken)).ToHashSet();
        var firstUse = new Dictionary<string, int>();
        foreach (var row in candidates)
        {
            var email = row.YouthEmail!;
            existing.TryGetValue(row.Line, out var childId);
            var child = childId == Guid.Empty ? null : children.GetValueOrDefault(childId);
            var born = row.DateOfBirth ?? child?.DateOfBirth;
            int? age = born is { } b ? date.Year - b.Year - (date < b.AddYears(date.Year - b.Year) ? 1 : 0) : null;
            string? problem;
            if (!email.Contains('@', StringComparison.Ordinal) || !email.Split('@')[^1].Contains('.', StringComparison.Ordinal))
            {
                problem = "Enter an email like name@example.org; not invited";
            }
            else if (firstUse.TryGetValue(email, out var first))
            {
                problem = $"Used on row {first}; not invited";
            }
            else if (age is null)
            {
                problem = "Add a date of birth to invite; not invited";
            }
            else if (age is < Staff.YouthInvitationHandler.YoungestAge or > Staff.YouthInvitationHandler.OldestAge)
            {
                problem = $"Youth accounts are for ages {Staff.YouthInvitationHandler.YoungestAge} to {Staff.YouthInvitationHandler.OldestAge}; not invited";
            }
            else if (child is not null && accounts.Contains(child.Id))
            {
                problem = $"{child.FullName} already has a youth account; not invited";
            }
            else if (child is not null && waiting.Contains(child.Id))
            {
                problem = "An invitation is already waiting; not invited again";
            }
            else if (access.TryGetValue(email, out var person))
            {
                problem = $"{person} already has access; not invited";
            }
            else
            {
                problem = null;
            }
            firstUse.TryAdd(email, row.Line);
            result[row.Line] = problem;
        }
        return result;
    }

    public static string Normal(string name) => string.Join(' ', name.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    public static string? Digits(string? phone) => phone is null ? null : ContactMask.Digits(phone);
}
