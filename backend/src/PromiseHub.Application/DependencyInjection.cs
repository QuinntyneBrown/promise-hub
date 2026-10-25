using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Households;
using PromiseHub.Application.Identity;
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
        services.AddScoped<ListHouseholdsHandler>();
        services.AddScoped<GetHouseholdHandler>();
        services.AddScoped<CreateHouseholdHandler>();
        services.AddScoped<AddChildHandler>();
        services.AddScoped<AddGuardianHandler>();
        services.AddScoped<UpdateGuardianHandler>();
        services.AddScoped<UpdateChildHandler>();
        services.AddScoped<UpdateMedicalHandler>();
        services.AddScoped<DeleteHouseholdHandler>();
        services.AddScoped<GetOrganizationSettingsHandler>();
        services.AddScoped<IModuleGate, ModuleGate>();
        services.AddScoped<GetModulesHandler>();
        services.AddScoped<SaveModulesHandler>();
        services.AddScoped<SignInHandler>();
        services.AddScoped<CompleteMfaHandler>();
        return services;
    }
}
