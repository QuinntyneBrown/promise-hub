using PromiseHub.Domain.LearningBond;

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

    /// <summary>The intake (L2-146): the record is known; only what is missing is asked, and numbers go in the fields.</summary>
    public static string Intake(string code, string child) => code switch
    {
        "es" => $"Ya tengo el nombre y la fecha de nacimiento de {child} de la inscripción. Solo le pediré lo que falta: los números van en las casillas, nunca en un mensaje para mí.",
        "fr" => $"J’ai déjà le nom et la date de naissance de {child} grâce à l’inscription. Je ne demande que ce qui manque : les numéros vont dans les cases, jamais dans un message pour moi.",
        _ => $"I already have {child}’s name and date of birth from the enrolment. I’ll only ask for what’s missing: numbers go in the boxes, never in a message to me.",
    };

    /// <summary>The estimate (L2-147): where the number comes from; it never states one itself.</summary>
    public static string Estimate(string code, string child) => code switch
    {
        "es" => $"Lo calculé con el año de nacimiento de {child} y las reglas del Gobierno de Canadá. No es una promesa: el Gobierno lo confirma con sus declaraciones.",
        "fr" => $"Je l’ai calculé à partir de l’année de naissance de {child} et des règles du gouvernement du Canada. Ce n’est pas une promesse : le gouvernement le confirme avec vos déclarations.",
        _ => $"I worked this out from {child}’s birth year with the Government of Canada’s rules. It isn’t a promise: the Government confirms it from your tax returns.",
    };

    /// <summary>The review (L2-148, L2-149): what was filled in, and that nothing is sent before Submit.</summary>
    public static string Review(string code, string provider) => code switch
    {
        "es" => $"Rellené la solicitud de {provider} con lo que ya tengo. Revise cada dato. Nada se envía hasta que toque Enviar.",
        "fr" => $"J’ai rempli la demande de {provider} avec ce que j’ai déjà. Vérifiez chaque champ. Rien n’est envoyé avant que vous touchiez Envoyer.",
        _ => $"I filled in {provider}’s application from what I have. Check each field. Nothing has been sent yet; here’s exactly what goes, and to whom.",
    };

    /// <summary>The benefits intake (L2-154): what is reused and how little more is asked.</summary>
    public static string BenefitsIntake(string code, IReadOnlyList<string> children) => code switch
    {
        "es" => $"Reutilizaré los datos de {string.Join(" y ", children)}, su SIN y su respuesta sobre impuestos. Necesito como mucho tres datos más.",
        "fr" => $"Je réutilise les renseignements de {string.Join(" et ", children)}, votre NAS et votre réponse sur l’impôt. Il me faut au plus trois faits de plus.",
        _ => $"I’ll reuse {string.Join(" and ", children)}’s details, your SIN and your tax answer. I need at most three more facts.",
    };

    /// <summary>The benefits list (L2-156): each one applied for on its own.</summary>
    public static string Benefits(string code, string place) => code switch
    {
        "es" => $"Esto es lo que {place} y Canadá probablemente le deben a su familia. Solicite cada uno por separado; nunca envío nada por usted.",
        "fr" => $"Voici ce que {place} et le Canada doivent probablement à votre famille. Faites chaque demande séparément; je n’envoie jamais rien à votre place.",
        _ => $"Here’s what {place} and Canada likely owe your family. Apply to each one on its own; I never send anything for you.",
    };

    /// <summary>A benefit application under review (L2-156 criterion 2).</summary>
    public static string BenefitReview(string code, bool form, string program) => (code, form) switch
    {
        ("es", true) => $"{program} recibe esta solicitud en papel o por correo. Rellené el formulario; usted lo envía y luego me avisa.",
        ("es", _) => "Lo rellené con lo que ya tengo. Revise cada dato; nada se envía hasta que toque Enviar.",
        ("fr", true) => $"{program} reçoit cette demande sur papier ou par courriel. J’ai rempli le formulaire; vous l’envoyez, puis vous me le dites.",
        ("fr", _) => "Je l’ai rempli avec ce que j’ai déjà. Vérifiez chaque champ; rien n’est envoyé avant que vous touchiez Envoyer.",
        (_, true) => $"{program} takes this one on paper or by email. I filled in the form; you send it, then tell me.",
        _ => "I filled this in from what you’ve given. Check each field; nothing is sent until you tap Submit.",
    };

    /// <summary>A paused claim (L2-151 criteria 1 and 2): what is missing, and that everything is kept.</summary>
    public static string Paused(string code, string child, LearningBondPausedReason? reason) => (code, reason) switch
    {
        ("es", LearningBondPausedReason.NeedsSin) => $"{child} necesita un número de seguro social para el Bono. Se pide gratis a Service Canada; le dejo el enlace. Todo lo que ya me dio queda guardado.",
        ("es", LearningBondPausedReason.NeedsTaxReturn) => "El Bono necesita la declaración de impuestos del año pasado. Hay clínicas gratuitas que la hacen por usted; le dejo el buscador. Todo lo demás queda guardado.",
        ("es", _) => $"La solicitud de {child} espera a que Harbourview corrija el registro. Todo queda guardado.",
        ("fr", LearningBondPausedReason.NeedsSin) => $"{child} a besoin d’un numéro d’assurance sociale pour le Bon. On le demande gratuitement à Service Canada; voici le lien. Tout ce que vous m’avez donné est gardé.",
        ("fr", LearningBondPausedReason.NeedsTaxReturn) => "Le Bon demande la déclaration de revenus de l’an dernier. Des comptoirs gratuits la font pour vous; voici l’outil pour en trouver un. Le reste est gardé.",
        ("fr", _) => $"La demande de {child} attend que le dossier soit corrigé. Tout est gardé.",
        (_, LearningBondPausedReason.NeedsSin) => $"{child} needs a social insurance number for the Learning Bond. You can apply for free through Service Canada; here’s the link. Everything you gave me is kept.",
        (_, LearningBondPausedReason.NeedsTaxReturn) => "The Learning Bond needs last year’s tax return. Free tax clinics can file it for you; here’s where to find one. Everything else is kept.",
        _ => $"{child}’s claim is waiting for the record to be fixed. Everything is kept.",
    };

    /// <summary>After Submit (L2-150): what was sent and what comes next.</summary>
    public static string Submitted(string code, string provider) => code switch
    {
        "es" => $"Listo. {provider} tiene la solicitud. Le enviaré un mensaje en cada paso; no tiene que hacer nada más ahora.",
        "fr" => $"C’est fait. {provider} a la demande. Je vous écrirai à chaque étape; vous n’avez rien d’autre à faire pour l’instant.",
        _ => $"Done. {provider} has the application. I’ll text you at each step; there’s nothing else for you to do now.",
    };

    /// <summary>The consent step (L2-145): why each child needs its own permission.</summary>
    public static string Consent(string code, string organization) => code switch
    {
        "es" => $"Antes de preguntar nada, necesito su permiso por cada hijo. Es distinto del consentimiento del programa que dio a {organization}.",
        "fr" => $"Avant de vous demander quoi que ce soit, j’ai besoin de votre permission pour chaque enfant. Elle est distincte du consentement au programme donné à {organization}.",
        _ => $"Before I ask anything, I need your permission for each child. It’s separate from the program consent you gave {organization}.",
    };
}
