using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Households;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());
        services.AddScoped<GetSessionHandler>();
        services.AddScoped<GetChildHandler>();
        return services;
    }
}
