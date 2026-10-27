using PromiseHub.Application;
using PromiseHub.Application.Learning;

namespace PromiseHub.Api.Endpoints;

public static class GatedExtensions
{
    /// <summary>Found → 200 with the value, NotFound → 404, Forbidden → 403 { code: "locked", unlockAfter }, Invalid → 422 { errors }, Conflict → 409 (ADR 0051).</summary>
    public static IResult ToHttp<T>(this Gated<T> gated) => gated.Status switch
    {
        ResultStatus.NotFound => Results.NotFound(),
        ResultStatus.Forbidden => Locked(gated.UnlockAfter),
        ResultStatus.Invalid => Results.Json(new { errors = gated.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
        ResultStatus.Conflict => Results.Json(new { code = "conflict" }, contentType: "application/problem+json", statusCode: StatusCodes.Status409Conflict),
        _ => Results.Ok(gated.Value),
    };

    public static IResult Locked(string? unlockAfter) =>
        Results.Json(new { code = "locked", unlockAfter }, contentType: "application/problem+json", statusCode: StatusCodes.Status403Forbidden);
}
