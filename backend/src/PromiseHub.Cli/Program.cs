using Microsoft.Extensions.Configuration;
using PromiseHub.Cli;
using PromiseHub.Infrastructure.Persistence.Seed;

var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
var configuration = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json", optional: true)
    .AddJsonFile($"appsettings.{environment}.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var connectionString = configuration.GetConnectionString("PromiseHub");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("ConnectionStrings:PromiseHub is not configured.");
    return 1;
}

var seed = new SeedOptions(configuration["Seed:StaffPassword"], configuration["Seed:MfaSecret"]);
return await CliApp.RunAsync(args, connectionString, environment == "Development", seed: seed);
