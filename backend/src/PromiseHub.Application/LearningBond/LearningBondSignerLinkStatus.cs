namespace PromiseHub.Application.LearningBond;

/// <summary>What a signer's link answers (L2-137 criteria 8 and 9): open, refused without the authority box, expired, or unknown.</summary>
public enum LearningBondSignerLinkStatus
{
    Open,
    Invalid,
    Expired,
    Unknown,
}
