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

    /// <summary>The provider received the application (L2-150 criterion 2).</summary>
    public static string Received(string code, string provider, string child) => code switch
    {
        "es" => $"{provider} recibió la solicitud de {child}.",
        "fr" => $"{provider} a reçu la demande de {child}.",
        _ => $"{provider} received {child}’s application.",
    };

    /// <summary>The bond was deposited, with the amount (L2-150 criterion 2).</summary>
    public static string Deposited(string code, int amount, string child) => code switch
    {
        "es" => $"Se depositaron ${amount:N0} en el RESP de {child}.",
        "fr" => $"{amount.ToString("N0", System.Globalization.CultureInfo.GetCultureInfo("fr-CA"))} $ ont été versés dans le REEE de {child}.",
        _ => $"${amount:N0} was deposited in {child}’s RESP.",
    };

    /// <summary>The provider needs a document, with the link it is sent from (L2-150 criteria 2 and 6).</summary>
    public static string DocumentNeeded(string code, string provider, string document, string child, string link) => code switch
    {
        "es" => $"{provider} necesita {document} para {child}. Toque para enviarlo: {link}",
        "fr" => $"{provider} a besoin de {document} pour {child}. Touchez pour l’envoyer : {link}",
        _ => $"{provider} needs {document} for {child}. Tap to send it: {link}",
    };

    /// <summary>The version of the Benefits consent wording (L2-153 criterion 2).</summary>
    public const int BenefitsConsentVersion = 1;

    /// <summary>The Benefits consent, separate from the Learning Bond one (L2-153 criterion 2).</summary>
    public static string BenefitsConsent(string code) => code switch
    {
        "es" => "Acepto que Learning Bond use lo que ya di, más el tamaño de mi hogar, mi estado civil y si recibo el Beneficio por Hijos de Canadá, para revisar y solicitar los beneficios por hijos que yo elija.",
        "fr" => "J’accepte que Learning Bond utilise ce que j’ai déjà donné, plus la taille de mon ménage, mon état civil et si je reçois l’Allocation canadienne pour enfants, pour vérifier et demander les prestations pour enfants que je choisis.",
        _ => "I agree that Learning Bond may use what I’ve already given, plus my household size, marital status and whether I get the Canada Child Benefit, to check and apply for child benefits I choose.",
    };

    /// <summary>A reminder on a date that matters (L2-157 criterion 2): what to do and the link.</summary>
    public static string DateReminder(string code, string sender, string kind, string subject, DateOnly on, string link)
    {
        var day = on.ToString(code switch { "es" => "d 'de' MMMM", "fr" => "d MMMM", _ => "MMMM d" },
            System.Globalization.CultureInfo.GetCultureInfo(code switch { "es" => "es", "fr" => "fr-CA", _ => "en-CA" }));
        return (code, kind) switch
        {
            ("es", "Taxes") => $"{sender}: recordatorio: presente sus impuestos de {subject} antes del 30 de abril para seguir recibiendo sus beneficios. {link} (STOP para salir)",
            ("es", "TurnsSix") => $"{sender}: {subject} cumple 6 años el {day}. El Beneficio por Hijos de Canadá cambia a los 6. {link} (STOP para salir)",
            ("es", "TurnsEighteen") => $"{sender}: {subject} cumple 18 años el {day}. Algunos beneficios cambian a los 18; esto es lo que hay que hacer. {link} (STOP para salir)",
            ("es", _) => $"{sender}: {subject} se renueva el {day}. Presente sus impuestos a tiempo para que siga. {link} (STOP para salir)",
            ("fr", "Taxes") => $"{sender} : rappel : produisez votre déclaration de {subject} avant le 30 avril pour continuer à recevoir vos prestations. {link} (STOP pour arrêter)",
            ("fr", "TurnsSix") => $"{sender} : {subject} aura 6 ans le {day}. L’Allocation canadienne pour enfants change à 6 ans. {link} (STOP pour arrêter)",
            ("fr", "TurnsEighteen") => $"{sender} : {subject} aura 18 ans le {day}. Certaines prestations changent à 18 ans; voici quoi faire. {link} (STOP pour arrêter)",
            ("fr", _) => $"{sender} : {subject} se renouvelle le {day}. Produisez votre déclaration à temps pour qu’elle continue. {link} (STOP pour arrêter)",
            (_, "Taxes") => $"{sender}: reminder: file your {subject} taxes by April 30 to keep your benefits coming. {link} (STOP to opt out)",
            (_, "TurnsSix") => $"{sender}: {subject} turns 6 on {day}. The Canada Child Benefit changes at 6. {link} (STOP to opt out)",
            (_, "TurnsEighteen") => $"{sender}: {subject} turns 18 on {day}. Some benefits change at 18; here’s what to do. {link} (STOP to opt out)",
            _ => $"{sender}: {subject} renews on {day}. File your taxes on time so it continues. {link} (STOP to opt out)",
        };
    }

    /// <summary>A benefit started, with the new total (L2-158 criterion 2).</summary>
    public static string BenefitStarted(string code, string benefit, int total) => code switch
    {
        "es" => $"{benefit} comenzó para su familia. Ya desbloqueó ${total:N0} hasta ahora.",
        "fr" => $"{benefit} a commencé pour votre famille. Vous avez débloqué {total.ToString("N0", System.Globalization.CultureInfo.GetCultureInfo("fr-CA"))} $ jusqu’ici.",
        _ => $"{benefit} has started for your family. You’ve unlocked ${total:N0} so far.",
    };

    /// <summary>A reminder to pick a paused claim back up (L2-151 criterion 3).</summary>
    public static string Reminder(string code, string sender, string child, string link) => code switch
    {
        "es" => $"{sender}: la solicitud del Bono de Estudios de {child} le espera. Toque para seguir donde lo dejó: {link} (STOP para salir)",
        "fr" => $"{sender} : la demande de Bon d’études de {child} vous attend. Touchez pour reprendre là où vous étiez : {link} (STOP pour arrêter)",
        _ => $"{sender}: {child}’s Learning Bond claim is waiting for you. Tap to pick up where you left off: {link} (STOP to opt out)",
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
