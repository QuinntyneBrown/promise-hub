namespace PromiseHub.Application.Guardian;

/// <summary>The consent link text and the copy of the record, in the household's language (L2-027).</summary>
public static class ConsentTexts
{
    public static string Link(string language, string organization, string child, string url) => GuardianLanguage.Code(language) switch
    {
        "es" => $"{organization}: lea y firme el consentimiento para que {child} participe en lecciones y mentoría: {url}",
        "fr" => $"{organization} : lisez et signez le consentement pour que {child} participe aux leçons et au mentorat : {url}",
        _ => $"{organization}: please read and sign the consent for {child} to take part in lessons and mentoring: {url}",
    };

    public static string CopySubject(string language, string child) => GuardianLanguage.Code(language) switch
    {
        "es" => $"Su consentimiento para {child}",
        "fr" => $"Votre consentement pour {child}",
        _ => $"Your consent for {child}",
    };

    public static string CopyBody(string language, string signedBy, string relationship, string child, string reference, string wording) => GuardianLanguage.Code(language) switch
    {
        "es" => $"{signedBy} ({relationship}) dio su consentimiento para {child}. Referencia {reference}. Texto firmado (en inglés): {wording}",
        "fr" => $"{signedBy} ({relationship}) a donné son consentement pour {child}. Référence {reference}. Texte signé (en anglais) : {wording}",
        _ => $"{signedBy} ({relationship}) gave consent for {child}. Reference {reference}. Wording signed: {wording}",
    };
}
