using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Attendance;
using PromiseHub.Application.Events;
using PromiseHub.Application.Households;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Application.Programs;

namespace PromiseHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());
        services.AddScoped<GetSessionHandler>();
        services.AddScoped<GetChildHandler>();
        services.AddScoped<FindChildrenHandler>();
        services.AddScoped<ListHouseholdsHandler>();
        services.AddScoped<GetHouseholdHandler>();
        services.AddScoped<CreateHouseholdHandler>();
        services.AddScoped<AddChildHandler>();
        services.AddScoped<AddGuardianHandler>();
        services.AddScoped<UpdateGuardianHandler>();
        services.AddScoped<UpdateChildHandler>();
        services.AddScoped<UpdateMedicalHandler>();
        services.AddScoped<DeleteHouseholdHandler>();
        services.AddScoped<ListProgramsHandler>();
        services.AddScoped<GetProgramHandler>();
        services.AddScoped<CreateProgramHandler>();
        services.AddScoped<UpdateProgramHandler>();
        services.AddScoped<ArchiveProgramHandler>();
        services.AddScoped<RestoreProgramHandler>();
        services.AddScoped<EnrollChildHandler>();
        services.AddScoped<RemoveFromRosterHandler>();
        services.AddScoped<ListEventsHandler>();
        services.AddScoped<GetEventHandler>();
        services.AddScoped<CreateEventHandler>();
        services.AddScoped<UpdateEventHandler>();
        services.AddScoped<CancelEventHandler>();
        services.AddScoped<SessionReader>();
        services.AddScoped<AttendanceWriter>();
        services.AddScoped<TodaySessionsHandler>();
        services.AddScoped<GetSessionRosterHandler>();
        services.AddScoped<CheckInHandler>();
        services.AddScoped<SessionAccess>();
        services.AddScoped<SignOutHandler>();
        services.AddScoped<GetPickupOptionsHandler>();
        services.AddScoped<MarkAbsentHandler>();
        services.AddScoped<AddWalkInHandler>();
        services.AddScoped<GetQuickCardHandler>();
        services.AddScoped<GetOrganizationSettingsHandler>();
        services.AddScoped<IModuleGate, ModuleGate>();
        services.AddScoped<GetModulesHandler>();
        services.AddScoped<SaveModulesHandler>();
        services.AddScoped<SignInHandler>();
        services.AddScoped<CompleteMfaHandler>();
        return services;
    }
}
