using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The government pages a paused claim points to (L2-151 criteria 1 and 2), in English or French; Spanish reads the English page, as the
/// Government of Canada publishes none in Spanish.
/// </summary>
public static class LearningBondHelpLinks
{
    public static string? For(LearningBondPausedReason? reason, string code) => (reason, code) switch
    {
        (LearningBondPausedReason.NeedsSin, "fr") => "https://www.canada.ca/fr/emploi-developpement-social/services/numero-assurance-sociale/demande.html",
        (LearningBondPausedReason.NeedsSin, _) => "https://www.canada.ca/en/employment-social-development/services/sin/apply.html",
        (LearningBondPausedReason.NeedsTaxReturn, "fr") => "https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/programme-communautaire-benevoles-matiere-impot/besoin-aide-remplir-declaration.html",
        (LearningBondPausedReason.NeedsTaxReturn, _) => "https://www.canada.ca/en/revenue-agency/services/tax/individuals/community-volunteer-income-tax-program/need-a-hand-complete-your-tax-return.html",
        _ => null,
    };
}
