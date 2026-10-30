using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Messaging;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Auth;
using PromiseHub.Infrastructure.Audit;
using PromiseHub.Infrastructure.Persistence;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        // Every save that adds or reads a notice tells the recipient's open streams (L2-110, ADR 0069).
        services.AddSingleton<Notifications.NotificationEvents>();
        services.AddDbContext<PromiseHubDbContext>((sp, o) => o.UseSqlite(connectionString).AddInterceptors(sp.GetRequiredService<Notifications.NotificationEvents>()));
        services.AddScoped<IPromiseHubDb>(sp => sp.GetRequiredService<PromiseHubDbContext>());
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IMigrationStatus, MigrationStatus>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITotpVerifier, TotpVerifier>();
        services.AddScoped<DatabaseSeeder>();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<ISmsSender, LoggingSmsSender>();
        services.AddSingleton<IEmailSender, LoggingEmailSender>();
        services.AddSingleton<PromiseHub.Application.Website.IPaymentProvider, Payments.UnconfiguredPaymentProvider>();
        services.AddSingleton<PromiseHub.Application.LearningBond.IRespProviderChannel, LearningBond.UnconfiguredRespProviderChannel>();
        services.AddSingleton<PromiseHub.Application.LearningBond.IProviderWebhookVerifier, LearningBond.HmacProviderWebhookVerifier>();
        services.AddSingleton<PromiseHub.Application.LearningBond.IBenefitChannel, LearningBond.UnconfiguredBenefitChannel>();
        // The open event streams (L2-107, ADR 0068): one hub per API instance, published to through the port.
        services.AddSingleton<Messaging.RealtimeHub>();
        services.AddSingleton<Application.Messaging.IRealtimeEvents>(sp => sp.GetRequiredService<Messaging.RealtimeHub>());
        services.AddSingleton<MessageDispatchRunner>();
        services.AddSingleton<Privacy.RetentionRunner>();
        services.AddSingleton<Observability.RequestMetrics>();
        services.AddSingleton<Observability.OpsAlertMonitor>();
        services.AddSingleton<Observability.IAlertSender, Observability.LoggingAlertSender>();
        services.AddSingleton<PromiseHub.Application.Imports.ISpreadsheetReader, Imports.SpreadsheetReader>();
        return services;
    }
}
