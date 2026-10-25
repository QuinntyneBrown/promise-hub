using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Infrastructure.Auth;
using PromiseHub.Infrastructure.Audit;
using PromiseHub.Infrastructure.Persistence;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<PromiseHubDbContext>(o => o.UseSqlite(connectionString));
        services.AddScoped<IPromiseHubDb>(sp => sp.GetRequiredService<PromiseHubDbContext>());
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IMigrationStatus, MigrationStatus>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITotpVerifier, TotpVerifier>();
        services.AddScoped<DatabaseSeeder>();
        services.AddSingleton(TimeProvider.System);
        return services;
    }
}
