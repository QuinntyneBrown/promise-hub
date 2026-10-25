using PromiseHub.Api.Authentication;
using PromiseHub.Api.Authorization;
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
builder.Services.AddStaffAuthentication();
builder.Services.AddPermissionAuthorization();

var app = builder.Build();

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseAuthentication();
app.UseMiddleware<TenantContextMiddleware>();
app.UseAuthorization();

app.MapGet("/health/ready", () => Results.Ok()).AllowAnonymous();
app.MapAuthEndpoints();
app.MapSessionEndpoints();
app.MapChildEndpoints();
app.MapSettingsEndpoints();

app.Run();

// Allows API integration tests to reference the host.
public partial class Program { }
