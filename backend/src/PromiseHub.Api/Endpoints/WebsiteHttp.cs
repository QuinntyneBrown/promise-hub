using PromiseHub.Application.Website;

namespace PromiseHub.Api.Endpoints;

/// <summary>Maps a public website request's outcome to its HTTP answer (L2-134).</summary>
public static class WebsiteHttp
{
    public static IResult ToHttp(WebsiteResult result) => result.Outcome switch
    {
        WebsiteOutcome.Done => Results.NoContent(),
        WebsiteOutcome.Ok => Results.Ok(result.Value),
        WebsiteOutcome.NotFound => Results.NotFound(),
        WebsiteOutcome.TooMany => Results.Json(new { code = "too-many" }, contentType: "application/problem+json", statusCode: StatusCodes.Status429TooManyRequests),
        WebsiteOutcome.Unavailable => Results.Json(new { code = "unavailable" }, contentType: "application/problem+json", statusCode: StatusCodes.Status503ServiceUnavailable),
        _ => Results.Json(new { errors = result.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
    };
}
