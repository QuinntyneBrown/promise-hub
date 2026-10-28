using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Notifications;

/// <summary>
/// The one table of notification kinds (L2-109, ADR 0069). A kind is listed only while every module it needs is on, so a notice of a module
/// that is off is hidden, never deleted.
/// </summary>
public sealed class NotificationKinds(IModuleGate modules)
{
    public static readonly IReadOnlyList<NotificationKind> All =
    [
        new("learning", [ModuleId.Learning], "Grades and badges", "When your work is graded, a quiz score is approved or you earn a badge.", r => r == Role.Youth),
        new("assignments", [ModuleId.Learning, ModuleId.Mentoring], "Assigned work", "When your mentor assigns you a lesson, quiz or assignment.", r => r == Role.Youth),
        new("messages", [ModuleId.Messages, ModuleId.Mentoring], "Messages", "When someone writes to you in a conversation.", r => r is Role.Youth or Role.Mentor),
        new("announcements", [ModuleId.Messages], "Announcements", "When an announcement for your programs is posted.", r => RolePermissions.Has(r, Permission.ReadAnnouncements)),
        new("incidents", [ModuleId.Incidents], "Incidents to review", "When an incident is reported.", r => RolePermissions.Has(r, Permission.ReviewIncidents)),
        new("mentoring", [ModuleId.Mentoring], "At-risk flags", "When a mentor flags a youth as at risk.", r => RolePermissions.Has(r, Permission.ReviewAtRiskFlags)),
        new("requests", [ModuleId.Roster], "Family data requests", "When a household asks for a copy or deletion of its data.", r => RolePermissions.Has(r, Permission.ManageSettings)),
        new("staff", [ModuleId.Roster], "Staff invitations", "When someone asks for a new invitation link.", r => RolePermissions.Has(r, Permission.ManageStaff)),
    ];

    /// <summary>The keys of the kinds whose modules are all on for the current organization.</summary>
    public async Task<HashSet<string>> VisibleAsync(CancellationToken cancellationToken = default)
    {
        var on = await modules.OnAsync(cancellationToken);
        return [.. All.Where(k => k.Modules.All(on.Contains)).Select(k => k.Key)];
    }

    /// <summary>The kinds a role receives whose modules are all on: the choices on its preferences page (L2-111).</summary>
    public async Task<IReadOnlyList<NotificationKind>> OfferedAsync(Role role, CancellationToken cancellationToken = default)
    {
        var visible = await VisibleAsync(cancellationToken);
        return [.. All.Where(k => visible.Contains(k.Key) && k.Receives(role))];
    }
}
