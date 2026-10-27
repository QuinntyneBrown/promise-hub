using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Curriculum;

/// <summary>Attaches, replaces and removes a lesson's video through file storage (L2-067 criteria 7 and 8, ADR 0050). Audited on LessonVideo.</summary>
public sealed class LessonVideoHandler(IPromiseHubDb db, ITenantContext tenant, IFileStore files, IAuditWriter audit, TimeProvider clock, LessonVideoOptions options)
{
    public async Task<(Result Result, LessonVideoDto? Video)> UploadAsync(Guid lessonId, string fileName, string? contentType, long length, Stream content, CancellationToken cancellationToken = default)
    {
        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == lessonId && l.DeletedAt == null, cancellationToken);
        if (lesson is null)
        {
            return (Result.NotFound, null);
        }
        var head = new byte[16];
        var read = await content.ReadAtLeastAsync(head, head.Length, throwOnEndOfStream: false, cancellationToken);
        var extension = LessonVideoPolicy.Accept(fileName, contentType, length, options.MaxBytes, head.AsSpan(0, read));
        if (extension is null)
        {
            return (Refused(), null);
        }
        var key = $"lessons/{tenant.OrganizationId}/{lessonId}/{Guid.NewGuid():N}{extension}";
        await files.SaveAsync(key, new HeadStream(head.AsMemory(0, read), content), cancellationToken);
        var previous = lesson.VideoKey;
        var name = Path.GetFileName(fileName);
        var now = clock.GetUtcNow();
        lesson.AttachVideo(name, key, contentType!, length, now, tenant.ActorName);
        audit.Record(new AuditEvent(AuditAction.Created, "LessonVideo", lessonId, $"{name} · {lesson.Title}", After: new { FileName = name, Bytes = length }));
        await db.SaveChangesAsync(cancellationToken);
        if (previous is not null)
        {
            await files.DeleteAsync(previous, cancellationToken);
        }
        return (Result.Created(lessonId), new LessonVideoDto(name, length, now, tenant.ActorName));
    }

    public async Task<Result> RemoveAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == lessonId && l.DeletedAt == null, cancellationToken);
        if (lesson?.VideoKey is not { } key)
        {
            return Result.NotFound;
        }
        var name = lesson.VideoFileName;
        lesson.RemoveVideo();
        audit.Record(new AuditEvent(AuditAction.Deleted, "LessonVideo", lessonId, $"{name} · {lesson.Title}", new { FileName = name }));
        await db.SaveChangesAsync(cancellationToken);
        await files.DeleteAsync(key, cancellationToken);
        return Result.Done;
    }

    public static Result Refused() => Result.Invalid(new Dictionary<string, string> { ["file"] = LessonVideoPolicy.Refusal });
}
