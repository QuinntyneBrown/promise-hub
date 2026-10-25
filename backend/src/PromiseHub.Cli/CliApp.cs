using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure;
using PromiseHub.Infrastructure.Persistence;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Cli;

/// <summary>Database commands: migrate [--check], seed, reset [--force]. Exit 0 ok, 1 failure, 2 usage, 3 migrations pending.</summary>
public static class CliApp
{
    public const string Usage = "Usage: promisehub (migrate [--check] | seed | reset [--force])";

    public static async Task<int> RunAsync(string[] args, string connectionString, bool isDevelopment = false, TextWriter? output = null)
    {
        output ??= Console.Out;
        var services = new ServiceCollection()
            .AddSingleton<ITenantContext>(TenantContext.System())
            .AddInfrastructure(connectionString)
            .BuildServiceProvider();
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseHubDbContext>();
        var flags = args.Skip(1).ToHashSet();

        switch (args.FirstOrDefault())
        {
            case "migrate":
                return await MigrateAsync(db, flags.Contains("--check"), output);
            case "seed":
                return await SeedAsync(db, scope.ServiceProvider.GetRequiredService<DatabaseSeeder>(), output);
            case "reset":
                if (!isDevelopment && !flags.Contains("--force"))
                {
                    output.WriteLine("reset is allowed only in Development or with --force.");
                    return 1;
                }
                await db.Database.EnsureDeletedAsync();
                var migrated = await MigrateAsync(db, check: false, output);
                return migrated != 0 ? migrated : await SeedAsync(db, scope.ServiceProvider.GetRequiredService<DatabaseSeeder>(), output);
            default:
                output.WriteLine(Usage);
                return 2;
        }
    }

    private static async Task<int> MigrateAsync(PromiseHubDbContext db, bool check, TextWriter output)
    {
        var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
        foreach (var migration in pending)
        {
            output.WriteLine($"Pending migration: {migration}");
        }
        if (check)
        {
            return pending.Count == 0 ? 0 : 3;
        }
        await db.Database.MigrateAsync();
        output.WriteLine($"Schema is current ({(await db.Database.GetAppliedMigrationsAsync()).LastOrDefault() ?? "empty"}).");
        return 0;
    }

    private static async Task<int> SeedAsync(PromiseHubDbContext db, DatabaseSeeder seeder, TextWriter output)
    {
        if ((await db.Database.GetPendingMigrationsAsync()).Any())
        {
            output.WriteLine("Run migrate first: migrations are pending.");
            return 1;
        }
        output.WriteLine($"Seeded {await seeder.SeedAsync()} new rows.");
        return 0;
    }
}
