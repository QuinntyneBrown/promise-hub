namespace PromiseHub.Domain.LearningBond;

/// <summary>One version of the platform's data-handling agreement (L2-136, ADR 0076). Platform data: no organization owns or edits it.</summary>
public sealed class LearningBondAgreement
{
    public LearningBondAgreement(Guid id, int version, DateOnly effectiveOn, string whatWeCollect, string whereItGoes, string whatYourOrganizationSees)
    {
        Id = id;
        Version = version;
        EffectiveOn = effectiveOn;
        WhatWeCollect = whatWeCollect;
        WhereItGoes = whereItGoes;
        WhatYourOrganizationSees = whatYourOrganizationSees;
    }

    public Guid Id { get; private set; }
    public int Version { get; private set; }
    public DateOnly EffectiveOn { get; private set; }
    public string WhatWeCollect { get; private set; }
    public string WhereItGoes { get; private set; }
    public string WhatYourOrganizationSees { get; private set; }
}
