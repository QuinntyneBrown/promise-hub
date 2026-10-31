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

    public static string Sms(string code, string sender, string child, string link) => code switch
    {
        "es" => $"{sender}: {child} podría tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: {link} (STOP para salir)",
        "fr" => $"{sender} : {child} pourrait recevoir jusqu’à 2 000 $ pour ses études après le secondaire. C’est gratuit. Touchez pour vérifier : {link} (STOP pour arrêter)",
        _ => $"{sender}: {child} may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: {link} (STOP to opt out)",
    };

    public static string EmailTitle(string code, string child) => code switch
    {
        "es" => $"{child} podría tener derecho a hasta $2,000 para estudiar",
        "fr" => $"{child} pourrait recevoir jusqu’à 2 000 $ pour ses études",
        _ => $"{child} may be owed up to $2,000 for school after high school",
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

    private static string Place(string organization, string? city) =>
        string.IsNullOrWhiteSpace(city) ? organization : $"{organization}, {city.Split(',')[0].Trim()}";
}
