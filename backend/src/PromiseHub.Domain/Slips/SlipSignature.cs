using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Slips;

/// <summary>A guardian's answer for one child to one version of a slip.</summary>
public sealed class SlipSignature : ITenantOwned
{
    public SlipSignature(Guid id, Guid organizationId, Guid slipId, Guid childId, int version, SignatureStatus status, string signedBy, DateTimeOffset at)
    {
        Id = id;
        OrganizationId = organizationId;
        SlipId = slipId;
        ChildId = childId;
        Version = version;
        Status = status;
        SignedBy = signedBy;
        At = at;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid SlipId { get; private set; }
    public Guid ChildId { get; private set; }
    public int Version { get; private set; }
    public SignatureStatus Status { get; private set; }
    public string SignedBy { get; private set; }
    public DateTimeOffset At { get; private set; }

    /// <summary>The browser that signed, as it described itself.</summary>
    public string? Device { get; private set; }

    /// <summary>The household language the slip was shown in.</summary>
    public string? Language { get; private set; }

    /// <summary>SHA-256 of the slip text as shown, so the record proves what was agreed to.</summary>
    public string? TextHash { get; private set; }

    public string? Answers { get; private set; }
    public string? Reason { get; private set; }

    public void Given(string? device, string language, string textHash, string? answers, string? reason)
    {
        Device = device;
        Language = language;
        TextHash = textHash;
        Answers = answers;
        Reason = reason;
    }

    public void Supersede() => Status = SignatureStatus.Superseded;
}
