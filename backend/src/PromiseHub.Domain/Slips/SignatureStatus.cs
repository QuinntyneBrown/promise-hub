namespace PromiseHub.Domain.Slips;

public enum SignatureStatus
{
    Signed,
    Declined,

    /// <summary>Signed or declined an earlier version that a material edit replaced.</summary>
    Superseded,
}
