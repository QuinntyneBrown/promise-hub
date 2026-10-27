using PromiseHub.Application.Guardian;

namespace PromiseHub.Api.Endpoints;

/// <summary>A consent request as HTTP: 202 with the masked contacts, 409 when the child needs no consent, 422 when no guardian can be reached.</summary>
public static class ConsentRequestHttp
{
    public static IResult ToHttp(ConsentRequestResult result) => result.Outcome switch
    {
        ConsentRequestOutcome.Sent => Results.Json(new { sentTo = result.SentTo }, statusCode: StatusCodes.Status202Accepted),
        ConsentRequestOutcome.NotNeeded => Results.Json(new { code = "not-needed" }, contentType: "application/problem+json", statusCode: StatusCodes.Status409Conflict),
        ConsentRequestOutcome.NoGuardian => Results.Json(new { code = "no-guardian" }, contentType: "application/problem+json", statusCode: StatusCodes.Status422UnprocessableEntity),
        _ => Results.NotFound(),
    };
}
