using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Enrollment;

/// <summary>Opens or closes a program's enrollment (dialogs: open-enrollment, close-enrollment); the link stays the same across reopenings.</summary>
public sealed class OpenEnrollmentHandler(IPromiseHubDb db, IAuditWriter audit, GuardianLinkOptions links)
{
    public async Task<string?> OpenAsync(Guid programId, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return null;
        }
        var stem = new string([.. program.Name.ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-')]).Trim('-');
        while (stem.Contains("--", StringComparison.Ordinal))
        {
            stem = stem.Replace("--", "-", StringComparison.Ordinal);
        }
        program.OpenEnrollment($"{stem}-{GuardianTokens.New()[..6].ToLowerInvariant()}");
        audit.Record(new AuditEvent(AuditAction.Updated, "Program", program.Id, $"{program.Name} · enrollment opened"));
        await db.SaveChangesAsync(cancellationToken);
        return Url(program.EnrollmentSlug!);
    }

    public async Task<Result> CloseAsync(Guid programId, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return Result.NotFound;
        }
        program.CloseEnrollment();
        audit.Record(new AuditEvent(AuditAction.Updated, "Program", program.Id, $"{program.Name} · enrollment closed"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public string Url(string slug) => $"{links.BaseUrl.TrimEnd('/')}/g/enroll/{slug}";
}
