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
builder.Services.AddHostedService<PromiseHub.Api.Hosting.MessageDispatchHostedService>();
builder.Services.AddSingleton(new PromiseHub.Application.Guardian.GuardianLinkOptions(builder.Configuration["Guardian:LinkBaseUrl"] ?? "http://localhost:4317"));
// Enums travel as their names, as the DTOs already do.
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
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
app.MapHouseholdEndpoints();
app.MapProgramEndpoints();
app.MapEventEndpoints();
app.MapAttendanceEndpoints();
app.MapMessagingEndpoints();
app.MapSlipEndpoints();
app.MapGuardianEndpoints();
app.MapImportEndpoints();
app.MapSettingsEndpoints();

app.Run();

// Allows API integration tests to reference the host.
public partial class Program { }
