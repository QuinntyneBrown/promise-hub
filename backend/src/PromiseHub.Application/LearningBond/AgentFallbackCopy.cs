namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The agent's approved line for each step of the guardian's claim, in English, Spanish and French (L2-160). It shows as is until the
/// model-backed agent (prompt 92) may rephrase it, and whenever the model is slow or down. It never states an amount the rule didn't compute.
/// </summary>
public static class AgentFallbackCopy
{
    /// <summary>The three sentences of the landing page (L2-144 criterion 3), naming the organization the information does not go to.</summary>
    public static string Welcome(string code, string organization) => code switch
    {
        "es" => "El Bono de Estudios Canadiense es dinero que el Gobierno de Canadá deposita en el RESP de un niño para familias con ingresos más bajos. "
            + $"No tiene que aportar dinero. Lo que escriba va al proveedor del RESP y al Gobierno de Canadá, no a {organization}.",
        "fr" => "Le Bon d’études canadien est de l’argent que le gouvernement du Canada verse dans le REEE d’un enfant pour les familles à revenu modeste. "
            + $"Vous n’avez rien à verser. Ce que vous saisissez va au fournisseur de REEE et au gouvernement du Canada, pas à {organization}.",
        _ => "The Canada Learning Bond is money the Government of Canada puts in a child’s RESP for families with lower incomes. "
            + $"You don’t need to put in any money. What you enter goes to the RESP provider and the Government of Canada, not to {organization}.",
    };

    /// <summary>The consent step (L2-145): why each child needs its own permission.</summary>
    public static string Consent(string code, string organization) => code switch
    {
        "es" => $"Antes de preguntar nada, necesito su permiso por cada hijo. Es distinto del consentimiento del programa que dio a {organization}.",
        "fr" => $"Avant de vous demander quoi que ce soit, j’ai besoin de votre permission pour chaque enfant. Elle est distincte du consentement au programme donné à {organization}.",
        _ => $"Before I ask anything, I need your permission for each child. It’s separate from the program consent you gave {organization}.",
    };
}
