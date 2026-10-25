using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using PromiseHub.Api.Endpoints;
using PromiseHub.Api.Middleware;
using PromiseHub.Application;
using PromiseHub.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("PromiseHub")
    ?? throw new InvalidOperationException("ConnectionStrings:PromiseHub is not configured.");

builder.Services.AddHostedService<MigrationGuard>();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(connectionString);
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.HttpOnly = true;
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        o.Cookie.SameSite = SameSiteMode.Strict;
        o.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });
// Endpoints require authentication unless they opt out with AllowAnonymous.
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

var app = builder.Build();

app.UseAuthentication();
app.UseMiddleware<TenantContextMiddleware>();
app.UseAuthorization();

app.MapGet("/health/ready", () => Results.Ok()).AllowAnonymous();
app.MapSessionEndpoints();
app.MapChildEndpoints();

app.Run();

// Allows API integration tests to reference the host.
public partial class Program { }
