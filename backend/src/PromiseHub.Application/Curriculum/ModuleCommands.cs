using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Adds modules to a track and saves their details (L2-066 criteria 3 and 4). Every write is audited.</summary>
public sealed class ModuleCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> CreateAsync(CreateModuleCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.Tracks.AnyAsync(t => t.Id == command.TrackId, cancellationToken))
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        var description = CurriculumRules.Clean(command.Description);
        if (Check(title, description, null) is { } invalid)
        {
            return invalid;
        }
        var position = await db.CurriculumModules.CountAsync(m => m.TrackId == command.TrackId, cancellationToken) + 1;
        var module = new CurriculumModule(Guid.NewGuid(), tenant.OrganizationId, command.TrackId, title!, description, position);
        db.CurriculumModules.Add(module);
        audit.Record(new AuditEvent(AuditAction.Created, "CurriculumModule", module.Id, title!, After: new { title, description, position }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(module.Id);
    }

    public async Task<Result> UpdateAsync(Guid id, SaveModuleCommand command, CancellationToken cancellationToken = default)
    {
        var module = await db.CurriculumModules.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (module is null)
        {
            return Result.NotFound;
        }
        var title = CurriculumRules.Clean(command.Title);
        var description = CurriculumRules.Clean(command.Description);
        var anchor = CurriculumRules.Clean(command.Anchor);
        if (Check(title, description, anchor) is { } invalid)
        {
            return invalid;
        }
        if (command.PrerequisiteModuleId is { } prerequisite
            && !await db.CurriculumModules.AnyAsync(m => m.Id == prerequisite && m.TrackId == module.TrackId && m.Position < module.Position, cancellationToken))
        {
            return CurriculumRules.Invalid("prerequisiteModuleId", "Choose a module that comes before this one.");
        }
        var before = new { module.Title, module.Description, module.PrerequisiteModuleId, module.Anchor };
        module.Update(title!, description, command.PrerequisiteModuleId, anchor);
        audit.Record(new AuditEvent(AuditAction.Updated, "CurriculumModule", id, title!, before, new { Title = title, Description = description, command.PrerequisiteModuleId, Anchor = anchor }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private static Result? Check(string? title, string? description, string? anchor)
    {
        if (title is null)
        {
            return CurriculumRules.Invalid("title", "Give the module a name.");
        }
        if (title.Length > CurriculumModule.MaximumTitle)
        {
            return CurriculumRules.Invalid("title", "Keep the name under 80 characters.");
        }
        if (description is { Length: > CurriculumModule.MaximumDescription })
        {
            return CurriculumRules.Invalid("description", "Keep the description under 1,000 characters.");
        }
        return anchor is { Length: > CurriculumModule.MaximumAnchor } ? CurriculumRules.Invalid("anchor", "Keep the anchor passage under 500 characters.") : null;
    }
}
