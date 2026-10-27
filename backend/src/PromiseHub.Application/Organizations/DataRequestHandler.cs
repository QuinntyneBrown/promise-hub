using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Households;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Notifications;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// Guardian data requests (L2-030 criterion 4): a verified guardian asks from the home page; staff who manage settings
/// fulfil it once. An export holds only the household's own records and is emailed; a deletion soft-deletes the
/// household, which is purged after 30 days. Every step is audited.
/// </summary>
public sealed class DataRequestHandler(IPromiseHubDb db, ITenantContext tenant, GuardianAccess access, IModuleGate modules,
    NotificationWriter notifications, IEmailSender email, IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> AskAsync(GuardianRequest request, DataRequestBody body, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null || scope.Link.SurveyId is not null || scope.Link.ForConsent)
        {
            return GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization));
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        if (!scope.Trusted)
        {
            return GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, []));
        }
        if (!Enum.TryParse<DataRequestKind>(body.Kind, out var kind) || !Enum.IsDefined(kind))
        {
            return GuardianResult.Invalid("kind", "Choose a copy or deletion.");
        }
        var address = body.Email?.Trim() ?? string.Empty;
        if (address.Length == 0)
        {
            return GuardianResult.Invalid("email", "Enter an email.");
        }
        if (!address.Contains('@', StringComparison.Ordinal) || !address.Split('@')[^1].Contains('.', StringComparison.Ordinal))
        {
            return GuardianResult.Invalid("email", "Enter an email like name@example.com.");
        }
        var dataRequest = new DataRequest(Guid.NewGuid(), scope.Link.OrganizationId, scope.Household.Id, kind, address, clock.GetUtcNow());
        db.DataRequests.Add(dataRequest);
        await notifications.NotifyAsync(Permission.ManageSettings, "requests",
            $"{scope.Household.Name} household asked for {(kind == DataRequestKind.Export ? "a copy of" : "deletion of")} their data.", "/settings/privacy", cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Created, "DataRequest", dataRequest.Id, $"{scope.Household.Name} · {kind}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Created, new { id = dataRequest.Id });
    }

    public async Task<DataRequestListDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var rows = await (
            from r in db.DataRequests.AsNoTracking()
            join h in db.Households.IgnoreQueryFilters().AsNoTracking() on r.HouseholdId equals h.Id
            where h.OrganizationId == tenant.OrganizationId
            select new { Request = r, h.Name }).ToListAsync(cancellationToken);
        return new DataRequestListDto([.. rows
            .OrderBy(x => x.Request.FulfilledAt is not null).ThenByDescending(x => x.Request.RequestedAt)
            .Select(x => new DataRequestDto(x.Request.Id, x.Name, x.Request.Kind.ToString(), x.Request.Email, x.Request.RequestedAt,
                x.Request.Open ? "Open" : "Fulfilled", x.Request.FulfilledBy))]);
    }

    public async Task<Result> FulfilAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dataRequest = await db.DataRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (dataRequest is null)
        {
            return Result.NotFound;
        }
        if (!dataRequest.Open)
        {
            return Result.Conflict;
        }
        var household = await db.Households.FirstOrDefaultAsync(h => h.Id == dataRequest.HouseholdId, cancellationToken);
        if (household is null)
        {
            return Result.NotFound;
        }
        var now = clock.GetUtcNow();
        string? export = null;
        if (dataRequest.Kind == DataRequestKind.Export)
        {
            export = await ExportAsync(household, cancellationToken);
            await email.SendAsync(dataRequest.Email, $"Your family's data from {(await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken)).Name}",
                "Here is the copy of your family's data you asked for. Reply if anything looks wrong.", cancellationToken);
        }
        else
        {
            household.SoftDelete(now, HouseholdRules.Retention);
            foreach (var guardian in await db.Guardians.Where(g => g.HouseholdId == household.Id).ToListAsync(cancellationToken))
            {
                guardian.SoftDelete(now);
            }
            foreach (var child in await db.Children.Where(c => c.HouseholdId == household.Id).ToListAsync(cancellationToken))
            {
                child.SoftDelete(now);
            }
        }
        dataRequest.Fulfil(tenant.ActorName, now, export);
        audit.Record(new AuditEvent(AuditAction.Updated, "DataRequest", dataRequest.Id, $"{household.Name} · {dataRequest.Kind} fulfilled"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<string?> ExportFileAsync(Guid id, CancellationToken cancellationToken = default) =>
        (await db.DataRequests.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, cancellationToken))?.Export;

    private async Task<string> ExportAsync(Domain.Households.Household household, CancellationToken cancellationToken)
    {
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == household.Id).ToListAsync(cancellationToken);
        var children = await db.Children.AsNoTracking().Where(c => c.HouseholdId == household.Id).ToListAsync(cancellationToken);
        var childIds = children.Select(c => c.Id).ToList();
        var enrollments = await (
            from e in db.Enrollments.AsNoTracking()
            where childIds.Contains(e.ChildId)
            join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
            select new { e.ChildId, p.Name, e.EnrolledAt, e.EndedAt }).ToListAsync(cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine(System.Globalization.CultureInfo.InvariantCulture, $"Household,{household.Name},{household.Language}");
        csv.AppendLine();
        csv.AppendLine("Guardian,Relationship,Mobile,Email,Language");
        foreach (var g in guardians)
        {
            csv.AppendLine(System.Globalization.CultureInfo.InvariantCulture, $"{g.Name},{g.Relationship},{g.Mobile},{g.Email},{g.Language}");
        }
        csv.AppendLine();
        csv.AppendLine("Child,Date of birth,School,Allergies,Medication");
        foreach (var c in children)
        {
            csv.AppendLine(System.Globalization.CultureInfo.InvariantCulture, $"{c.FullName},{c.DateOfBirth},\"{c.School}\",\"{c.Allergies}\",\"{c.Medication}\"");
        }
        csv.AppendLine();
        csv.AppendLine("Child,Program,Enrolled,Ended");
        foreach (var e in enrollments)
        {
            csv.AppendLine(System.Globalization.CultureInfo.InvariantCulture, $"{children.Single(c => c.Id == e.ChildId).FullName},{e.Name},{e.EnrolledAt:yyyy-MM-dd},{e.EndedAt:yyyy-MM-dd}");
        }
        return csv.ToString();
    }
}
