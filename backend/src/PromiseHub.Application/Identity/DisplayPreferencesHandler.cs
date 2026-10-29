using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Identity;

namespace PromiseHub.Application.Identity;

/// <summary>
/// The signed-in person's own display preferences (L2-119, L2-120, ADR 0072). They belong to the person (`StaffUser`), like the password,
/// so they follow them to every organization; only the known values are kept. Not audited: display choices are not sensitive.
/// </summary>
public sealed class DisplayPreferencesHandler(IPromiseHubDb db, ITenantContext tenant)
{
    public static readonly DisplayPreferencesDto Defaults = new(DisplayOptions.Themes[0], DisplayOptions.TextSizes[0], false);

    public async Task<DisplayPreferencesDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var user = await PersonAsync(tracking: false, cancellationToken);
        return user is null ? Defaults : new DisplayPreferencesDto(user.Theme, user.TextSize, user.ReduceMotion);
    }

    public async Task<Result> SaveAsync(SaveDisplayPreferencesRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        if (request.Theme is null || !DisplayOptions.Themes.Contains(request.Theme))
        {
            errors["theme"] = "Choose System, Light or Dark.";
        }
        if (request.TextSize is null || !DisplayOptions.TextSizes.Contains(request.TextSize))
        {
            errors["textSize"] = "Choose Default, Large or Larger.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var user = await PersonAsync(tracking: true, cancellationToken);
        if (user is null)
        {
            return Result.NotFound;
        }
        user.ChangeDisplay(request.Theme!, request.TextSize!, request.ReduceMotion);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private async Task<StaffUser?> PersonAsync(bool tracking, CancellationToken cancellationToken)
    {
        var email = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.Email).SingleAsync(cancellationToken);
        var users = tracking ? db.StaffUsers : db.StaffUsers.AsNoTracking();
        return await users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }
}
