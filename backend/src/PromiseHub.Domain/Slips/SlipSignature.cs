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

    public void Supersede() => Status = SignatureStatus.Superseded;
}
