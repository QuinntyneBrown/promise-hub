using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The Learning Bond agent (L2-160, ADR 0085). Each step has an approved fixed line shown first; the model's answer replaces it only when it
/// comes within the timeout, has 60 words or fewer, states no amount a rule did not produce and repeats no nine-digit number. The model sees
/// the household's language, the children's first names and ages, statuses and computed figures, and nothing else; a SIN typed into the
/// chat is refused before the model. Its five tools are read-only and answer for the link's household only.
/// </summary>
public sealed partial class LearningBondAgent(IPromiseHubDb db, LearningBondGuardianScope guardianScope, ILanguageModel model, LearningBondTotals totals,
    LearningBondBenefitsAccess benefits, IAuditWriter audit, ILearningBondAgentSettings settings, TimeProvider clock)
{
    public const int MaximumWords = 60;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private static readonly IReadOnlyList<LanguageModelTool> Tools =
    [
        new("GetStatus", "Where each child's claim stands, and whether the benefits check was done.", new Dictionary<string, string>()),
        new("GetEstimate", "The rule's estimate for one child of this family.", new Dictionary<string, string> { ["child"] = "The child's first name." }),
        new("ListBenefits", "Each child benefit this family's check found, with its state.", new Dictionary<string, string>()),
        new("ExplainStep", "The approved explanation of one step of the page.", new Dictionary<string, string> { ["step"] = "One of: " + string.Join(", ", LearningBondAgentPrompts.Steps) }),
        new("OfferCallback", "Offer the family a call from a person at the organization.", new Dictionary<string, string>()),
    ];

    public async Task<GuardianResult> AskAsync(GuardianRequest request, AskLearningBondAgentRequest ask, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var step = LearningBondAgentPrompts.Steps.Contains(ask.Step) ? ask.Step! : "Landing";
        var code = GuardianLanguage.Code(scope!.Household.Language);
        var facts = await FactsAsync(scope, cancellationToken);
        var fixedLine = await FixedAsync(step, code, scope, facts, cancellationToken);
        var message = (ask.Message ?? string.Empty).Trim();
        if (message.Length > LearningBondAgentMessage.MaximumText)
        {
            message = message[..LearningBondAgentMessage.MaximumText];
        }
        // A SIN in the chat never reaches the model, and is kept only as removed (L2-146 criterion 7, L2-159).
        if (message.Length > 0 && NineDigits().IsMatch(message))
        {
            var refusal = AgentFallbackCopy.SinRefused(code);
            Audit(scope, step, "fixed");
            await KeepAsync(scope, step, NineDigits().Replace(message, AgentFallbackCopy.NumberRemoved(code)), refusal, cancellationToken);
            return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondAgentReplyDto(step, fixedLine, refusal, "fixed"));
        }
        var history = message.Length == 0 ? [] : (await db.LearningBondAgentMessages.AsNoTracking().Where(m => m.HouseholdId == scope.Household.Id)
            .ToListAsync(cancellationToken)).OrderByDescending(m => m.CreatedAt).Take(10).OrderBy(m => m.CreatedAt)
            .Select(m => new LanguageModelTurn(m.Role == "Guardian" ? "user" : "assistant", m.Text)).ToList();
        var context = JsonSerializer.Serialize(facts.Context, Json);
        var modelRequest = new LanguageModelRequest(LearningBondAgentPrompts.For(step, code, scope.Organization.Name, context), history,
            message.Length == 0 ? "Explain this step to me." : message, Tools, code);
        var reply = Usable(await AnswerAsync(modelRequest, scope, code, facts, cancellationToken), facts.Amounts);
        Audit(scope, step, reply is null ? "fixed" : "model");
        if (message.Length > 0)
        {
            await KeepAsync(scope, step, message, reply ?? fixedLine, cancellationToken);
        }
        else
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondAgentReplyDto(step, fixedLine, reply, reply is null ? "fixed" : "model"));
    }

    /// <summary>The household's own conversation, oldest first.</summary>
    public async Task<GuardianResult> ConversationAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var messages = (await db.LearningBondAgentMessages.AsNoTracking().Where(m => m.HouseholdId == scope!.Household.Id).ToListAsync(cancellationToken))
            .OrderBy(m => m.CreatedAt).ThenBy(m => m.Role == "Agent").Select(m => new LearningBondAgentMessageDto(m.Role, m.Text, m.Step, m.CreatedAt)).ToList();
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondConversationDto(messages));
    }

    /// <summary>The model's answer within the timeout, or null when it is slow, down or answers nothing (L2-160 criterion 4).</summary>
    private async Task<string?> AnswerAsync(LanguageModelRequest request, GuardianScope scope, string code, AgentFacts facts, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(settings.Timeout);
        try
        {
            return await model.ReplyAsync(request, (call, ct) => RunToolAsync(call, scope, code, facts, ct), timeout.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return null;
        }
        catch (Exception e) when (e is HttpRequestException or InvalidOperationException or JsonException or IOException)
        {
            return null;
        }
    }

    /// <summary>The read-only tools, each answered for the link's household only (L2-160 criterion 2).</summary>
    private async Task<string> RunToolAsync(LanguageModelToolCall call, GuardianScope scope, string code, AgentFacts facts, CancellationToken cancellationToken)
    {
        var known = Tools.Any(t => t.Name == call.Name);
        var answer = await ToolAnswerAsync(call, scope, code, facts, cancellationToken);
        // By tool name only, never the arguments or the answer (L2-161, ADR 0076).
        var summary = !known ? $"Learning Bond agent tool refused: {Short(call.Name)}"
            : answer == "Not found." ? $"Learning Bond agent tool {call.Name}: not found" : $"Learning Bond agent tool {call.Name}";
        audit.Record(new AuditEvent(known ? AuditAction.Viewed : AuditAction.AccessDenied, nameof(LearningBondAgentMessage), scope.Household.Id, summary));
        return answer;
    }

    private void Audit(GuardianScope scope, string step, string source) =>
        audit.Record(new AuditEvent(AuditAction.Sent, nameof(LearningBondAgentMessage), scope.Household.Id, $"Learning Bond agent replied on {step} ({source})"));

    private static string Short(string name) => name.Length > 40 ? name[..40] : name;

    private async Task<string> ToolAnswerAsync(LanguageModelToolCall call, GuardianScope scope, string code, AgentFacts facts, CancellationToken cancellationToken)
    {
        switch (call.Name)
        {
            case "GetStatus":
                return JsonSerializer.Serialize(new { children = facts.Context.Children.Select(c => new { c.FirstName, c.Claim }), facts.Context.BenefitsChecked }, Json);
            case "GetEstimate":
                var name = call.Arguments.GetValueOrDefault("child")?.Trim() ?? string.Empty;
                var child = facts.Context.Children.FirstOrDefault(c => string.Equals(c.FirstName, name, StringComparison.CurrentCultureIgnoreCase));
                return child is null ? "Not found."
                    : child.Estimate is { } amount ? $"{child.FirstName}: up to ${amount.ToString(CultureInfo.InvariantCulture)}, by the Learning Bond rule version {LearningBondRule.Current.Version}."
                    : $"{child.FirstName}: no Learning Bond estimate.";
            case "ListBenefits":
                if (!facts.Context.BenefitsChecked)
                {
                    return "No benefits check yet.";
                }
                var applied = (await db.LearningBondBenefitApplications.AsNoTracking().Where(a => a.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken))
                    .Where(a => a.Sent).Select(a => BenefitCatalogue.Named(a.BenefitKey)?.Name).OfType<string>().ToList();
                return applied.Count == 0 ? "The check is done; nothing applied for yet." : "Applied for: " + string.Join(", ", applied) + ".";
            case "ExplainStep":
                var step = call.Arguments.GetValueOrDefault("step");
                return LearningBondAgentPrompts.Steps.Contains(step) ? await FixedAsync(step!, code, scope, facts, cancellationToken) : "Not found.";
            case "OfferCallback":
                return "Tell the family they can choose “I’d rather talk to someone” on the page; someone from the organization will call them.";
            default:
                return "No such tool.";
        }
    }

    /// <summary>A reply the page may show: 60 words or fewer, no nine-digit number, and only amounts the rules produced (L2-160 criteria 3 and 6).</summary>
    private static string? Usable(string? reply, IReadOnlySet<int> amounts)
    {
        var text = reply?.Trim();
        if (string.IsNullOrEmpty(text) || text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length > MaximumWords || NineDigits().IsMatch(text))
        {
            return null;
        }
        foreach (Match m in Money().Matches(text))
        {
            var digits = new string([.. m.Value.Where(char.IsDigit)]);
            if (!int.TryParse(digits, NumberStyles.None, CultureInfo.InvariantCulture, out var amount) || !amounts.Contains(amount))
            {
                return null;
            }
        }
        return text;
    }

    private async Task KeepAsync(GuardianScope scope, string step, string guardian, string agent, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        db.LearningBondAgentMessages.Add(new LearningBondAgentMessage(Guid.NewGuid(), scope.Household.OrganizationId, scope.Household.Id, step, "Guardian", guardian, now));
        db.LearningBondAgentMessages.Add(new LearningBondAgentMessage(Guid.NewGuid(), scope.Household.OrganizationId, scope.Household.Id, step, "Agent",
            agent.Length > LearningBondAgentMessage.MaximumText ? agent[..LearningBondAgentMessage.MaximumText] : agent, now));
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<string> FixedAsync(string step, string code, GuardianScope scope, AgentFacts facts, CancellationToken cancellationToken)
    {
        var first = facts.Context.Children.FirstOrDefault(c => c.Claim is not null)?.FirstName ?? facts.Context.Children.FirstOrDefault()?.FirstName ?? string.Empty;
        var provider = (await db.LearningBondApplications.AsNoTracking().Where(a => a.HouseholdId == scope.Household.Id && a.Provider != null).Select(a => a.Provider)
            .FirstOrDefaultAsync(cancellationToken)) ?? RespProviders.All[0].Name;
        return step switch
        {
            "Consent" => AgentFallbackCopy.Consent(code, scope.Organization.Name),
            "Intake" => AgentFallbackCopy.Intake(code, first),
            "Estimate" => AgentFallbackCopy.Estimate(code, first),
            "Review" => AgentFallbackCopy.Review(code, provider),
            "Submitted" => AgentFallbackCopy.Submitted(code, provider),
            "Benefits" => AgentFallbackCopy.Benefits(code, scope.Organization.City),
            "Reminders" => AgentFallbackCopy.Reminders(code),
            "Total" => AgentFallbackCopy.Total(code),
            _ => AgentFallbackCopy.Welcome(code, scope.Organization.Name),
        };
    }

    /// <summary>
    /// What the agent may know (L2-160 criterion 1): first names, ages, claim statuses and the rules' figures; and every amount it may state.
    /// Never a SIN, a birth date, a contact, an address, an answer or a document.
    /// </summary>
    private async Task<AgentFacts> FactsAsync(GuardianScope scope, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone)).DateTime);
        var claims = await db.LearningBondClaims.AsNoTracking().Where(c => c.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
        var children = (await db.Children.AsNoTracking().Where(c => c.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken))
            .Where(c => c.AgeOn(today) is null or < 21).OrderBy(c => c.FirstName, StringComparer.CurrentCulture)
            .Select(c =>
            {
                var claim = claims.Where(k => k.ChildId == c.Id && k.Status != LearningBondClaimStatus.NotCompleted).OrderByDescending(k => k.UpdatedAt).FirstOrDefault();
                return new AgentChild(c.FirstName, c.AgeOn(today), claim?.Status.ToString(), claim?.PausedReason?.ToString(),
                    claim?.EstimateAmount ?? (c.DateOfBirth is { } born ? LearningBondRule.Current.Estimate(born.Year, today.Year) : null));
            }).ToList();
        var lines = await totals.LinesAsync(scope.Household.Id, scope.Organization.TimeZone, cancellationToken);
        var confirmed = lines.Where(l => l.Confirmed).Sum(l => l.Amount);
        var appliedFor = lines.Where(l => !l.Confirmed).Sum(l => l.Amount);
        var context = new AgentContext(scope.Organization.Name, children, await benefits.ConsentedAsync(scope.Household.Id, cancellationToken), confirmed, appliedFor);
        var rule = LearningBondRule.Current;
        var amounts = new HashSet<int>([.. children.Select(c => c.Estimate).OfType<int>(), .. lines.Select(l => l.Amount), confirmed, appliedFor,
            rule.FirstYearAmount, rule.LaterYearAmount, rule.Cap]);
        return new AgentFacts(context, amounts);
    }

    // Nine digits, alone or grouped by spaces or hyphens: a SIN, or anything that could be one.
    [GeneratedRegex(@"(?<!\d)\d{3}[\s-]?\d{3}[\s-]?\d{3}(?!\d)")]
    private static partial Regex NineDigits();

    // A dollar amount: "$1,400", "$ 1400" or "1 400 $".
    [GeneratedRegex(@"\$\s?\d[\d,\u00a0\u202f ]*\d|\$\s?\d|\d[\d,\u00a0\u202f ]*\s?\$")]
    private static partial Regex Money();
}
