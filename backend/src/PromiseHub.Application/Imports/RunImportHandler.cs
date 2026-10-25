using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Households;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Imports;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Imports;

/// <summary>
/// Creates the households, guardians and children of an import in one go: rows of the same guardian share a household, a
/// guardian whose phone is already on file updates that household, duplicates are skipped unless merged, rows without a
/// child name or any contact are left to fix, and the whole import is one audit entry (L2-010 criteria 2, 3 and 5).
/// </summary>
public sealed class RunImportHandler(IPromiseHubDb db, ITenantContext tenant, ImportRows rows, IAuditWriter audit, TimeProvider clock)
{
    public async Task<(Result Result, ImportSummaryDto? Summary)> HandleAsync(Guid id, RunImportCommand command, CancellationToken cancellationToken = default)
    {
        var session = await db.ImportSessions.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (session is null)
        {
            return (Result.NotFound, null);
        }
        if (session.Status != ImportStatus.Mapped)
        {
            return (Result.Conflict, null);
        }
        var merge = (command.Merge ?? []).ToHashSet();
        var read = ImportRows.Read(session);
        var duplicates = await rows.DuplicatesAsync(read, cancellationToken);
        var guardians = await db.Guardians.Where(g => g.Mobile != null).ToListAsync(cancellationToken);
        var enrolled = session.ProgramId is { } pid
            ? (await db.Enrollments.Where(e => e.ProgramId == pid && e.EndedAt == null).Select(e => e.ChildId).ToListAsync(cancellationToken)).ToHashSet()
            : [];
        var now = clock.GetUtcNow();
        var created = new Dictionary<string, Household>();
        var updated = new HashSet<Guid>();
        var toFix = new List<ImportRowIssueDto>();
        int imported = 0, children = 0, enrolments = 0, skipped = 0;

        foreach (var row in read)
        {
            var problem = ImportRows.Problem(row);
            if (problem is "No child name" or "No phone or email")
            {
                toFix.Add(new ImportRowIssueDto(row.Line, row.ChildName, problem));
                continue;
            }
            if (duplicates.TryGetValue(row.Line, out var existingChildId) && !merge.Contains(row.Line))
            {
                skipped++;
                continue;
            }
            var language = HouseholdRules.Languages.Contains(row.Language ?? string.Empty) ? row.Language! : LanguageOf(row.Language);
            var key = ImportRows.Digits(row.Phone) ?? row.Email?.ToLowerInvariant() ?? ImportRows.Normal(row.GuardianName ?? row.ChildName);
            Guid householdId;
            var onFile = row.Phone is null ? null : guardians.FirstOrDefault(g => ImportRows.Digits(g.Mobile) == ImportRows.Digits(row.Phone));
            if (onFile is not null)
            {
                householdId = onFile.HouseholdId;
                updated.Add(householdId);
            }
            else if (created.TryGetValue(key, out var household))
            {
                householdId = household.Id;
            }
            else
            {
                var guardianName = row.GuardianName ?? "Guardian";
                var (_, last) = PersonName.Split(guardianName);
                household = new Household(Guid.NewGuid(), tenant.OrganizationId, string.IsNullOrEmpty(last) ? guardianName : last, language);
                db.Households.Add(household);
                db.Guardians.Add(new Domain.Households.Guardian(Guid.NewGuid(), tenant.OrganizationId, household.Id, guardianName, "Guardian",
                    row.Phone, row.Email, language, isPrimary: true, canPickUp: true, canSign: true));
                created[key] = household;
                householdId = household.Id;
            }

            Guid childId;
            if (duplicates.TryGetValue(row.Line, out existingChildId))
            {
                childId = existingChildId;
                var existing = await db.Children.SingleAsync(c => c.Id == existingChildId, cancellationToken);
                if (row.School is not null)
                {
                    existing.UpdateDetails(existing.FirstName, existing.LastName, existing.DateOfBirth, row.School);
                }
            }
            else
            {
                var (first, last) = PersonName.Split(row.ChildName);
                var child = new Child(Guid.NewGuid(), tenant.OrganizationId, householdId, first, last, row.DateOfBirth, row.School);
                if (row.Allergies is not null)
                {
                    child.UpdateMedical(new MedicalDetails(row.Allergies, null, null, null, false), tenant.ActorName, now);
                }
                child.UpdateNotes(row.Notes);
                db.Children.Add(child);
                childId = child.Id;
                children++;
            }
            if (session.ProgramId is { } programId && enrolled.Add(childId))
            {
                db.Enrollments.Add(new Domain.Programs.Enrollment(Guid.NewGuid(), tenant.OrganizationId, programId, childId, now));
                enrolments++;
            }
            imported++;
        }

        var programName = session.ProgramId is { } p ? (await db.Programs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == p, cancellationToken))?.Name : null;
        var summary = new ImportSummaryDto(session.FileName, read.Count, imported, created.Count, updated.Count, children, enrolments, skipped, toFix.Count, toFix, programName);
        session.Complete(JsonSerializer.Serialize(summary));
        audit.Record(new AuditEvent(AuditAction.Imported, "Import", session.Id,
            $"{session.FileName} · {read.Count} rows · imported by {tenant.ActorName} · {imported} imported, {skipped} skipped, {toFix.Count} to fix"));
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, summary);
    }

    private static string LanguageOf(string? code) => code?.Trim().ToLowerInvariant() switch
    {
        "es" or "spa" or "español" or "espanol" => "Spanish",
        "fr" or "fra" or "français" or "francais" => "French",
        _ => "English",
    };
}
