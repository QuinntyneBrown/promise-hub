namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The platform-approved invitation wording in English, Spanish and French (L2-139, ADR 0076). No endpoint writes it; every send reads the
/// household's language and falls back to English (criterion 4, L2-027). Only the sender name, the child's and guardian's first names and
/// the link are filled in.
/// </summary>
public static class LearningBondTexts
{
    /// <summary>The languages in the order every list shows them.</summary>
    public static readonly string[] Languages = ["en", "es", "fr"];

    public static string LanguageName(string code) => code switch
    {
        "es" => "Spanish",
        "fr" => "French",
        _ => "English",
    };

    public static string Sms(string code, string sender, string child, string link) => Sms(code, sender, [child], link);

    /// <summary>The text naming each eligible child of a household, with the verb agreeing (L2-140).</summary>
    public static string Sms(string code, string sender, IReadOnlyList<string> children, string link) => code switch
    {
        "es" => $"{sender}: {Names(code, children)} {(children.Count > 1 ? "podrían" : "podría")} tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: {link} (STOP para salir)",
        "fr" => $"{sender} : {Names(code, children)} {(children.Count > 1 ? "pourraient" : "pourrait")} recevoir jusqu’à 2 000 $ pour ses études après le secondaire. C’est gratuit. Touchez pour vérifier : {link} (STOP pour arrêter)",
        _ => $"{sender}: {Names(code, children)} may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: {link} (STOP to opt out)",
    };

    public static string EmailTitle(string code, string child) => EmailTitle(code, [child]);

    public static string EmailTitle(string code, IReadOnlyList<string> children) => code switch
    {
        "es" => $"{Names(code, children)} {(children.Count > 1 ? "podrían" : "podría")} tener derecho a hasta $2,000 para estudiar",
        "fr" => $"{Names(code, children)} {(children.Count > 1 ? "pourraient" : "pourrait")} recevoir jusqu’à 2 000 $ pour ses études",
        _ => $"{Names(code, children)} may be owed up to $2,000 for school after high school",
    };

    public static string EmailText(string code, string guardian) => code switch
    {
        "es" => $"Hola, {guardian}. El Gobierno de Canadá deposita el Bono de Estudios Canadiense en un RESP para familias con ingresos más bajos. No cuesta nada y no hace falta aportar dinero. Compruébelo en unos 15 minutos desde su teléfono.",
        "fr" => $"Bonjour {guardian}. Le gouvernement du Canada verse le Bon d’études canadien dans un REEE pour les familles à revenu modeste. C’est gratuit et vous n’avez rien à verser. Vérifiez en 15 minutes environ sur votre téléphone.",
        _ => $"Hi {guardian}. The Government of Canada puts the Canada Learning Bond into an RESP for families with lower incomes. It costs nothing and you don’t need to put in any money. Check in about 15 minutes on your phone.",
    };

    public static string EmailAction(string code) => code switch
    {
        "es" => "Comprobar ahora",
        "fr" => "Vérifier maintenant",
        _ => "Check now",
    };

    public static string EmailFooter(string code, string sender, string organization, string? city) => code switch
    {
        "es" => $"{sender} a través de PromiseHub · {Place(organization, city)} · Dejar de recibir correos",
        "fr" => $"{sender} via PromiseHub · {Place(organization, city)} · Se désabonner",
        _ => $"{sender} via PromiseHub · {Place(organization, city)} · Unsubscribe",
    };

    /// <summary>The previews' sample names and link: the preview reads no household, so it shows no family's name (L2-136 criterion 5).</summary>
    public const string SampleChild = "Maya";
    public const string SampleGuardian = "Alex";
    public const string SampleLink = "promisehub.ca/lb/4r7k9x";

    /// <summary>The version of the consent wording below; a new wording is a new version (L2-145 criterion 2).</summary>
    public const int ConsentVersion = 1;

    /// <summary>The exact consent a guardian gives for one child (L2-145 criterion 1).</summary>
    public static string Consent(string code, string child) => code switch
    {
        "es" => $"Acepto que Learning Bond recopile los números de seguro social de {child} y míos y nuestra situación fiscal, y los envíe al proveedor de RESP que yo elija "
            + "y al Gobierno de Canadá para solicitar el Bono de Estudios Canadiense.",
        "fr" => $"J’accepte que Learning Bond recueille les numéros d’assurance sociale de {child} et le mien ainsi que notre situation fiscale, et les envoie au fournisseur "
            + "de REEE que je choisis et au gouvernement du Canada pour demander le Bon d’études canadien.",
        _ => $"I agree that Learning Bond may collect {child}’s and my social insurance numbers and tax-filing status and send them to the RESP provider I choose and the "
            + "Government of Canada to apply for the Canada Learning Bond.",
    };

    /// <summary>"Mateo", "Mateo and Sofía", "Ana, Mateo and Sofía", with the language's "and".</summary>
    public static string Names(string code, IReadOnlyList<string> children)
    {
        var and = code switch { "es" => "y", "fr" => "et", _ => "and" };
        return children.Count <= 1 ? string.Concat(children) : $"{string.Join(", ", children.Take(children.Count - 1))} {and} {children[^1]}";
    }

    private static string Place(string organization, string? city) =>
        string.IsNullOrWhiteSpace(city) ? organization : $"{organization}, {city.Split(',')[0].Trim()}";
}
