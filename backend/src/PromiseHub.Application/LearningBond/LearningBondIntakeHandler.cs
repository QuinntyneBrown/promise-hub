using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The intake (L2-146, L2-159): it confirms the child's record and asks only for the guardian's SIN, the child's SIN and last year's tax
/// return. SINs are validated on the server, encrypted at the field and kept with their last three digits; the guardian's SIN and the tax
/// answer belong to the household and are reused for every child. Only for a child with Learning Bond consent in force.
/// </summary>
public sealed class LearningBondIntakeHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondClaimFinder claims, ILearningBondCipher cipher,
    LearningBondStaffNotifier staff, IAuditWriter audit, TimeProvider clock)
{
    public const string SinMessage = "Check the number. A SIN has 9 digits, like 123 456 782.";
    public const string SameSinMessage = "Each person has their own SIN.";
    public const string TaxMessage = "Choose Yes, No or Not sure.";

    public async Task<GuardianResult> GetAsync(GuardianRequest request, Guid childId, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await ClaimAsync(scope!.Household.Id, childId, cancellationToken) is not { } claim)
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == childId, cancellationToken);
        var intake = await db.LearningBondIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.HouseholdId == scope.Household.Id, cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        var year = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone)).Year - 1;
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondIntakeDto(code, scope.Organization.Name, AgentFallbackCopy.Intake(code, child.FirstName), child.Id,
            child.FirstName, child.FullName, child.DateOfBirth, year, intake?.GuardianSinLast3, claim.ChildSinLast3, intake?.TaxFiled?.ToString(),
            claim.PausedReason == LearningBondPausedReason.AwaitingRecordFix));
    }

    public async Task<GuardianResult> SaveAsync(GuardianRequest request, Guid childId, SaveLearningBondIntakeRequest answers, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await ClaimAsync(scope!.Household.Id, childId, cancellationToken, tracked: true) is not { } claim)
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        if (!cipher.IsAvailable)
        {
            return GuardianResult.Of(GuardianOutcome.Unavailable);
        }
        var errors = new Dictionary<string, string>();
        var guardianSin = Sin(answers.GuardianSin, "guardianSin", errors);
        var childSin = Sin(answers.ChildSin, "childSin", errors);
        LearningBondTaxFiled? taxFiled = null;
        if (!string.IsNullOrWhiteSpace(answers.TaxFiled))
        {
            if (Enum.TryParse<LearningBondTaxFiled>(answers.TaxFiled, out var parsed) && Enum.IsDefined(parsed))
            {
                taxFiled = parsed;
            }
            else
            {
                errors["taxFiled"] = TaxMessage;
            }
        }
        var intake = await db.LearningBondIntakes.FirstOrDefaultAsync(i => i.HouseholdId == scope.Household.Id, cancellationToken);
        // Each person has their own SIN: compare with what is given now or kept (criterion 4).
        if (errors.Count == 0 && childSin is not null)
        {
            var kept = guardianSin ?? (intake?.GuardianSin is { IsDestroyed: false } g ? cipher.Decrypt(g) : null);
            if (kept == childSin)
            {
                errors["childSin"] = SameSinMessage;
            }
        }
        if (errors.Count > 0)
        {
            return new GuardianResult(GuardianOutcome.Invalid, Errors: errors);
        }
        var now = clock.GetUtcNow();
        if (intake is null)
        {
            intake = new LearningBondIntake(Guid.NewGuid(), scope.Household.OrganizationId, scope.Household.Id, now);
            db.LearningBondIntakes.Add(intake);
        }
        var saved = new List<string>();
        if (guardianSin is not null)
        {
            intake.SetGuardianSin(cipher.Encrypt(guardianSin), now);
            saved.Add("guardian SIN");
        }
        if (childSin is not null)
        {
            claim.SetChildSin(cipher.Encrypt(childSin), now);
            saved.Add("child SIN");
        }
        if (taxFiled is { } answer)
        {
            intake.SetTaxFiled(answer, now);
            saved.Add("tax return");
        }
        if (saved.Count > 0)
        {
            var child = await db.Children.AsNoTracking().Where(c => c.Id == childId).Select(c => c.FirstName).SingleAsync(cancellationToken);
            // Field names only, never a value (L2-159, L2-161).
            audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondIntake), intake.Id, $"Learning Bond intake saved for {child}: {string.Join(", ", saved)}"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    /// <summary>Fix this: the claim waits for staff to correct the child's record, and the staff who see status are told what to check.</summary>
    public async Task<GuardianResult> RequestFixAsync(GuardianRequest request, Guid childId, LearningBondRecordFixRequest fix, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await ClaimAsync(scope!.Household.Id, childId, cancellationToken, tracked: true) is not { } claim)
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        var note = (fix.Note ?? string.Empty).Trim();
        if (note.Length is 0 or > 500)
        {
            return GuardianResult.Invalid("note", "Tell us what to fix, in up to 500 characters.");
        }
        // A nine-digit number never goes to staff in a note (L2-146 criterion 7, L2-159).
        note = System.Text.RegularExpressions.Regex.Replace(note, @"\d[\d\s-]{7,}\d", "•••");
        claim.Pause(LearningBondPausedReason.AwaitingRecordFix, clock.GetUtcNow());
        var child = await db.Children.AsNoTracking().Where(c => c.Id == childId).Select(c => c.FirstName).SingleAsync(cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondClaim), claim.Id, $"Learning Bond: the {scope.Household.Name} household asked to fix {child}’s record"));
        await staff.NotifyAsync($"The {scope.Household.Name} household asks to fix {child}’s record for Learning Bond: “{note}”", $"/families/{scope.Household.Id}", cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    private Task<LearningBondClaim?> ClaimAsync(Guid householdId, Guid childId, CancellationToken cancellationToken, bool tracked = false) =>
        claims.ForChildAsync(householdId, childId, tracked, cancellationToken);

    /// <summary>The nine digits of a SIN given now, or null when none was given; a value that is not a SIN adds the field's error.</summary>
    private static string? Sin(string? value, string field, Dictionary<string, string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }
        // Nine digits that pass the check digit, and not a temporary (9) or never-issued (0, 8) first digit (L2-146 criterion 3).
        if (SocialInsuranceNumber.Normalize(value) is { } sin && sin[0] is not ('0' or '8'))
        {
            return sin;
        }
        errors[field] = SinMessage;
        return null;
    }
}
