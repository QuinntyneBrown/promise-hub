using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>The quiz's current questions in an attempt's fixed order; questions added since come last and deleted ones drop out (ADR 0055).</summary>
public static class AttemptOrder
{
    public static List<QuizQuestion> Apply(QuizAttempt attempt, IEnumerable<QuizQuestion> questions)
    {
        var all = questions.OrderBy(q => q.Position).ToList();
        var order = attempt.QuestionOrder.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Guid.Parse).ToList();
        return [.. all.Where(q => order.Contains(q.Id)).OrderBy(q => order.IndexOf(q.Id)), .. all.Where(q => !order.Contains(q.Id))];
    }
}
