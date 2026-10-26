using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Surveys;

namespace PromiseHub.Application.Surveys;

/// <summary>
/// The guardian's survey page (L2-043): verified like every guardian link (L2-026), shown in the household's language
/// (L2-027), answered once per child while open.
/// </summary>
public sealed class GuardianSurveyHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, TimeProvider clock)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, survey, eventName, child, guardian, answered) = page!.Value;
        var status = answered ? "Answered" : clock.GetUtcNow() >= survey.ClosesAt ? "Closed" : "Open";
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianSurveyDto(
            GuardianLanguage.Code(scope.Household.Language), scope.Organization.Name, scope.Organization.Phone,
            guardian, eventName, child.FirstName, survey.SentBy, status));
    }

    public async Task<GuardianResult> AnswerAsync(GuardianRequest request, SurveyAnswerRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, survey, _, child, _, answered) = page!.Value;
        if (answered || clock.GetUtcNow() >= survey.ClosesAt)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict);
        }
        if (body.Rating is not (>= 1 and <= 5))
        {
            return GuardianResult.Invalid("rating", "Pick a number from 1 to 5.");
        }
        var comment = string.IsNullOrWhiteSpace(body.Comment) ? null : body.Comment.Trim();
        db.SurveyResponses.Add(new SurveyResponse(Guid.NewGuid(), scope.Link.OrganizationId, survey.Id, child.Id, scope.Household.Id, body.Rating.Value,
            comment is { Length: > 1000 } ? comment[..1000] : comment, clock.GetUtcNow()));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    private async Task<(GuardianResult? Problem, (GuardianScope Scope, Survey Survey, string EventName, Domain.Households.Child Child, string Guardian, bool Answered)? Page)> LoadAsync(
        GuardianRequest request, CancellationToken cancellationToken)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SurveyId is null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization)), null);
        }
        if (!await modules.IsOnAsync(ModuleId.Reports, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        var survey = await db.Surveys.AsNoTracking().FirstOrDefaultAsync(s => s.Id == scope.Link.SurveyId, cancellationToken);
        var e = survey is null ? null : await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == survey.EventId, cancellationToken);
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == scope.Link.ChildId, cancellationToken);
        if (survey is null || e is null || child is null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope.Organization)), null);
        }
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
        if (!scope.Trusted)
        {
            var contacts = guardians.Where(g => g.Mobile is not null).Select(g => ContactMask.Phone(g.Mobile!))
                .Concat(guardians.Where(g => g.Email is not null && !g.EmailBounced).Select(g => ContactMask.Email(g.Email!))).ToList();
            return (GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, contacts)), null);
        }
        var answered = await db.SurveyResponses.AnyAsync(r => r.SurveyId == survey.Id && r.ChildId == child.Id, cancellationToken);
        var primary = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
        return (null, (scope, survey, e.Name, child, primary?.Name.Split(' ')[0] ?? string.Empty, answered));
    }
}
