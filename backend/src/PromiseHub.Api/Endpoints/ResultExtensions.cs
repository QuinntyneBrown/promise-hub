using PromiseHub.Application;

namespace PromiseHub.Api.Endpoints;

public static class ResultExtensions
{
    /// <summary>Done → 204, Created → 201 with the id, NotFound → 404, Forbidden → 403, Invalid → 422 with { errors: { field: message } }.</summary>
    public static IResult ToHttp(this Result result, string? location = null) => result.Status switch
    {
        ResultStatus.Created => Results.Created(location is null ? null : $"{location}/{result.Id}", new { id = result.Id }),
        ResultStatus.NotFound => Results.NotFound(),
        ResultStatus.Forbidden => Results.Json(new { code = "forbidden" }, contentType: "application/problem+json", statusCode: StatusCodes.Status403Forbidden),
        ResultStatus.Invalid => Results.Json(new { errors = result.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
        _ => Results.NoContent(),
    };
}
