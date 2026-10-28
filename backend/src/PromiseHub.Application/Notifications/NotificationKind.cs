using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Notifications;

/// <summary>
/// One kind of notification (L2-109, ADR 0069): its key, the modules it needs (all of them on for it to be listed), and its name and hint on
/// the preferences page, and who receives it (a role or a permission), which decides whether it is offered as a choice.
/// </summary>
public sealed record NotificationKind(string Key, IReadOnlyList<ModuleId> Modules, string Name, string Hint, Func<Role, bool> Receives);
