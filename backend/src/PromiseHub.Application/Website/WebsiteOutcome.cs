namespace PromiseHub.Application.Website;

/// <summary>How a public website request ended (L2-134).</summary>
public enum WebsiteOutcome
{
    Done,
    Ok,
    NotFound,
    Invalid,
    TooMany,
    Unavailable,
}
