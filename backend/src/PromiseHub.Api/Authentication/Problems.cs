namespace PromiseHub.Api.Authentication;

/// <summary>Writes the small JSON problem body the web app reads: { code, ... }.</summary>
public static class Problems
{
    public static Task Write(HttpResponse response, int status, string code)
    {
        response.StatusCode = status;
        return response.WriteAsJsonAsync(new { code }, options: null, contentType: "application/problem+json");
    }
}
