namespace PromiseHub.Api.Middleware;

/// <summary>Response headers from L2-031 criterion 1. HTTPS redirection and HSTS are added outside Development and Testing.</summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
        headers["Referrer-Policy"] = "no-referrer";
        return next(context);
    }
}
