namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One child's estimate (learning-bond-estimate, L2-147): "up to" one amount from the rule and the rule's version; none for a child born
/// before 2004; and whether a tax return must be filed first.
/// </summary>
public sealed record LearningBondEstimateDto(string Language, string Organization, string Explanation, Guid ChildId, string FirstName, int? Amount, int RuleVersion,
    bool BornBefore2004, bool NeedsTaxReturn);
