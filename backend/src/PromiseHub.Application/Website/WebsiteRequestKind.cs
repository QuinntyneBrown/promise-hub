namespace PromiseHub.Application.Website;

/// <summary>The kinds of request a visitor sends; the limit counts each kind separately (L2-134 criterion 4).</summary>
public enum WebsiteRequestKind
{
    Contact,
    Volunteer,
    Donation,
}
