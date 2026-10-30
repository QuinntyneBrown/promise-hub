using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A document the provider asked for (L2-150 criterion 6): the guardian uploads a PDF, JPEG or PNG of up to 10 MB through the link, kept
/// only as ciphertext in the file store, and Send is the only way it reaches the provider, once. Another household's document is unknown.
/// </summary>
public sealed class LearningBondDocumentHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondClaimFinder claims, ILearningBondCipher cipher,
    IFileStore files, IRespProviderChannel channel, IAuditWriter audit, TimeProvider clock)
{
    public const string FileMessage = "Choose a PDF, JPEG or PNG up to 10 MB.";

    private static readonly Dictionary<string, string> Types = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
    };

    public async Task<GuardianResult> UploadAsync(GuardianRequest request, Guid documentId, string fileName, string? contentType, long length, Stream content,
        CancellationToken cancellationToken = default)
    {
        var (gate, document, _) = await OwnAsync(request, documentId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (document!.SentAt is not null)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "sent" });
        }
        var name = Path.GetFileName(fileName ?? string.Empty);
        if (!Types.TryGetValue(Path.GetExtension(name), out var type) || !string.Equals(type, contentType, StringComparison.OrdinalIgnoreCase))
        {
            return GuardianResult.Invalid("file", FileMessage);
        }
        if (length > LearningBondDocument.MaximumBytes)
        {
            return GuardianResult.Invalid("file", $"That file is {Math.Ceiling(length / (1024d * 1024d))} MB. {FileMessage}");
        }
        if (!cipher.IsAvailable)
        {
            return GuardianResult.Of(GuardianOutcome.Unavailable);
        }
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        var key = $"learning-bond/{document.OrganizationId}/documents/{document.Id}";
        using (var encrypted = new MemoryStream(cipher.EncryptDocument(buffer.ToArray())))
        {
            await files.SaveAsync(key, encrypted, cancellationToken);
        }
        document.Upload(name.Length > 200 ? name[^200..] : name, type, key, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondDocument), document.Id, $"Learning Bond document uploaded: {document.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new { id = document.Id, fileName = document.FileName });
    }

    /// <summary>The guardian's Send: decrypts in memory and sends once; a repeat answers the same; a refusal sends nothing and can be retried.</summary>
    public async Task<GuardianResult> SendAsync(GuardianRequest request, Guid documentId, CancellationToken cancellationToken = default)
    {
        var (gate, document, application) = await OwnAsync(request, documentId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (document!.SentAt is not null)
        {
            return GuardianResult.Of(GuardianOutcome.Accepted, new { id = document.Id, sentAt = document.SentAt });
        }
        if (document.StorageKey is null || RespProviders.Named(application!.Provider) is not { } provider)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "no-file" });
        }
        if (!cipher.IsAvailable)
        {
            return GuardianResult.Of(GuardianOutcome.Unavailable);
        }
        var key = document.BeginSending();
        await db.SaveChangesAsync(cancellationToken);
        byte[] ciphertext;
        await using (var stored = await files.OpenReadAsync(document.StorageKey, cancellationToken))
        {
            if (stored is null)
            {
                return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "no-file" });
            }
            using var buffer = new MemoryStream();
            await stored.CopyToAsync(buffer, cancellationToken);
            ciphertext = buffer.ToArray();
        }
        var result = await channel.SendDocumentAsync(new RespDocument(key, provider.Name, provider.Channel, application.ProviderReference, document.Name,
            document.FileName!, document.ContentType!, cipher.DecryptDocument(ciphertext)), cancellationToken);
        if (!result.Sent)
        {
            return GuardianResult.Of(GuardianOutcome.NotSent);
        }
        document.MarkSent(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Sent, nameof(LearningBondDocument), document.Id, $"Learning Bond document sent to {provider.Name}: {document.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Accepted, new { id = document.Id, sentAt = document.SentAt });
    }

    private async Task<(GuardianResult? Gate, LearningBondDocument? Document, LearningBondApplication? Application)> OwnAsync(GuardianRequest request, Guid documentId,
        CancellationToken cancellationToken)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return (gate, null, null);
        }
        var document = await db.LearningBondDocuments.FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);
        var application = document is null ? null
            : await db.LearningBondApplications.AsNoTracking().FirstOrDefaultAsync(a => a.Id == document.ApplicationId && a.HouseholdId == scope!.Household.Id, cancellationToken);
        if (application is null || await claims.ForChildAsync(scope!.Household.Id, application.ChildId, cancellationToken: cancellationToken) is null)
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null, null);
        }
        return (null, document, application);
    }
}
