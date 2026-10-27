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
builder.Services.AddHostedService<PromiseHub.Api.Hosting.RetentionHostedService>();
builder.Services.AddHostedService<PromiseHub.Api.Hosting.OpsAlertHostedService>();
// Lesson videos (ADR 0050): stored on disk under Storage:RootPath, up to Lessons:MaxVideoBytes each.
builder.Services.AddSingleton<IFileStore>(new PromiseHub.Infrastructure.Storage.LocalFileStore(
    builder.Configuration["Storage:RootPath"] ?? Path.Combine(builder.Environment.ContentRootPath, "App_Data", "files")));
builder.Services.AddSingleton(new PromiseHub.Application.Curriculum.LessonVideoOptions(
    builder.Configuration.GetValue<long?>("Lessons:MaxVideoBytes") ?? PromiseHub.Application.Curriculum.LessonVideoOptions.DefaultMaxBytes));
builder.Services.AddSingleton(new PromiseHub.Application.Guardian.GuardianLinkOptions(builder.Configuration["Guardian:LinkBaseUrl"] ?? "http://localhost:4317"));
// Enums travel as their names, as the DTOs already do.
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddStaffAuthentication();
builder.Services.AddPermissionAuthorization();

// One structured line per request comes from RequestLoggingMiddleware; the framework's own request lines would repeat
// the raw path and query, which can carry a child's name (L2-041).
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.AddJsonConsole();
}

var app = builder.Build();

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

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
app.MapPlatformEndpoints();
app.MapHouseholdEndpoints();
app.MapTodayEndpoints();
app.MapSearchEndpoints();
app.MapNotificationEndpoints();
app.MapReportEndpoints();
app.MapBillingEndpoints();
app.MapAuditEndpoints();
app.MapProgramEndpoints();
app.MapEventEndpoints();
app.MapAttendanceEndpoints();
app.MapMessagingEndpoints();
app.MapSlipEndpoints();
app.MapGuardianEndpoints();
app.MapImportEndpoints();
app.MapEnrollmentEndpoints();
app.MapIncidentEndpoints();
app.MapSmsWebhookEndpoints();
app.MapStaffEndpoints();
app.MapInvitationEndpoints();
app.MapSettingsEndpoints();
app.MapParticipantModuleEndpoints();
app.MapLearningEndpoints();
app.MapCurriculumEndpoints();
app.MapMentoringEndpoints();
app.MapMentorAssignmentEndpoints();

app.Run();

// Allows API integration tests to reference the host.
public partial class Program { }
