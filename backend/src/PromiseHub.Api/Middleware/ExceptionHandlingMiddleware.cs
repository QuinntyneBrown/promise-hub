namespace PromiseHub.Api.Middleware;

/// <summary>
/// Turns an unhandled fault into a 500 with the request's correlation id as a reference the person can quote; the
/// exception's details stay in the log, never in the response (L2-041).
/// </summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            logger.LogError(exception, "Unhandled fault ({CorrelationId})", context.TraceIdentifier);
            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { code = "server-error", reference = context.TraceIdentifier });
        }
    }
}
