using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Checks a badge (L2-084 criterion 4): its name, icon, kind, the rule and target of an automatic badge, and the competency.</summary>
public static class BadgeRules
{
    /// <summary>The icons a badge may use, drawn by ph-achievement-badge.</summary>
    public static readonly IReadOnlyList<string> Icons = ["star", "award", "heart", "flag", "book", "sparkle", "people", "check"];

    public static async Task<(BadgeFields? Fields, Dictionary<string, string> Errors)> CheckAsync(IPromiseHubDb db, BadgeCommand command, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string>();
        var name = CurriculumRules.Clean(command.Name);
        var description = CurriculumRules.Clean(command.Description);
        if (name is null)
        {
            errors["name"] = "Give the badge a name.";
        }
        else if (name.Length > Badge.MaximumName)
        {
            errors["name"] = "Keep the name under 60 characters.";
        }
        if (description?.Length > Badge.MaximumDescription)
        {
            errors["description"] = "Keep the description under 200 characters.";
        }
        if (command.Icon is null || !Icons.Contains(command.Icon))
        {
            errors["icon"] = "Choose an icon.";
        }
        BadgeKind? kind = command.Kind switch { "Automatic" => BadgeKind.Automatic, "Manual" => BadgeKind.Manual, _ => null };
        if (kind is null)
        {
            errors["kind"] = "Choose how it’s earned.";
        }
        BadgeRule? rule = null;
        Guid? target = null;
        if (kind == BadgeKind.Automatic)
        {
            rule = Enum.TryParse<BadgeRule>(command.Rule, out var parsed) && Enum.IsDefined(parsed) && !int.TryParse(command.Rule, out _) ? parsed : null;
            if (rule is null)
            {
                errors["rule"] = "Choose a rule.";
            }
            else if (command.TargetId is not { } id || !await TargetExistsAsync(db, rule.Value, id, cancellationToken))
            {
                errors["targetId"] = $"Choose the {Noun(rule.Value)} that earns it.";
            }
            else
            {
                target = id;
            }
        }
        if (command.CompetencyId is { } competencyId && !await db.Competencies.AnyAsync(c => c.Id == competencyId, cancellationToken))
        {
            errors["competencyId"] = "Choose a competency of the progression framework.";
        }
        return errors.Count > 0 ? (null, errors) : (new BadgeFields(name!, command.Icon!, description, kind!.Value, rule, target, command.CompetencyId), errors);
    }

    public static string Noun(BadgeRule rule) => rule switch
    {
        BadgeRule.LessonCompleted => "lesson",
        BadgeRule.ModuleCompleted => "module",
        BadgeRule.QuizPassed => "quiz",
        _ => "assignment",
    };

    private static Task<bool> TargetExistsAsync(IPromiseHubDb db, BadgeRule rule, Guid id, CancellationToken cancellationToken) => rule switch
    {
        BadgeRule.LessonCompleted => db.Lessons.AnyAsync(l => l.Id == id && l.DeletedAt == null, cancellationToken),
        BadgeRule.ModuleCompleted => db.CurriculumModules.AnyAsync(m => m.Id == id, cancellationToken),
        BadgeRule.QuizPassed => db.Quizzes.AnyAsync(q => q.Id == id, cancellationToken),
        _ => db.Assignments.AnyAsync(a => a.Id == id, cancellationToken),
    };
}
