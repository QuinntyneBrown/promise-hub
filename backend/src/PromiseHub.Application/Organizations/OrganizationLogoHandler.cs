using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Curriculum;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// The organization's logo (L2-123, ADR 0073): a PNG or JPEG recognised by its first bytes, up to 1 MB, stored under
/// <c>logos/{organizationId}/{random}.{ext}</c>, never under the uploader's file name. SVG is refused because it can carry script.
/// A new logo replaces and deletes the earlier file; uploads and removals are audited on OrganizationLogo.
/// </summary>
public sealed class OrganizationLogoHandler(IPromiseHubDb db, ITenantContext tenant, IFileStore files, IAuditWriter audit, TimeProvider clock)
{
    public const long MaxBytes = 1024 * 1024;
    public const string Refusal = "Choose a PNG or JPEG of up to 1 MB.";

    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];

    public static Result Refused() => Result.Invalid(new Dictionary<string, string> { ["file"] = Refusal });

    public async Task<(Result Result, OrganizationLogoDto? Logo)> UploadAsync(string fileName, long length, Stream content, CancellationToken cancellationToken = default)
    {
        if (length is <= 0 or > MaxBytes)
        {
            return (Refused(), null);
        }
        var head = new byte[8];
        var read = await content.ReadAtLeastAsync(head, head.Length, throwOnEndOfStream: false, cancellationToken);
        var kind = Kind(head.AsSpan(0, read));
        if (kind is null)
        {
            return (Refused(), null);
        }
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var key = $"logos/{organization.Id}/{Guid.NewGuid():N}{kind.Value.Extension}";
        await files.SaveAsync(key, new HeadStream(head.AsMemory(0, read), content), cancellationToken);
        var previous = organization.LogoKey;
        var name = Path.GetFileName(fileName);
        var now = clock.GetUtcNow();
        organization.AttachLogo(key, name, kind.Value.ContentType, now, tenant.ActorName);
        audit.Record(new AuditEvent(AuditAction.Created, "OrganizationLogo", organization.Id, $"Logo {name} uploaded by {tenant.ActorName}", After: new { FileName = name, Bytes = length }));
        await db.SaveChangesAsync(cancellationToken);
        if (previous is not null)
        {
            await files.DeleteAsync(previous, cancellationToken);
        }
        return (Result.Created(organization.Id), new OrganizationLogoDto(name, now, tenant.ActorName));
    }

    public async Task<OrganizationLogoFile?> OpenAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        if (organization.LogoKey is not { } key || await files.OpenReadAsync(key, cancellationToken) is not { } stream)
        {
            return null;
        }
        return new OrganizationLogoFile(stream, organization.LogoContentType!);
    }

    public async Task<Result> RemoveAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        if (organization.LogoKey is not { } key)
        {
            return Result.NotFound;
        }
        var name = organization.LogoFileName;
        organization.RemoveLogo();
        audit.Record(new AuditEvent(AuditAction.Deleted, "OrganizationLogo", organization.Id, $"Logo {name} removed by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        await files.DeleteAsync(key, cancellationToken);
        return Result.Done;
    }

    private static (string Extension, string ContentType)? Kind(ReadOnlySpan<byte> head) =>
        head.StartsWith(PngSignature) ? (".png", "image/png")
        : head.StartsWith(JpegSignature) ? (".jpg", "image/jpeg")
        : null;
}
