using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Infrastructure.Persistence;

/// <summary>Used only by <c>dotnet ef migrations add</c>.</summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<PromiseHubDbContext>
{
    public PromiseHubDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<PromiseHubDbContext>().UseSqlite("Data Source=design.db").Options, TenantContext.System());
}
