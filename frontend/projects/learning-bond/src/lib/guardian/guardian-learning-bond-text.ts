/** The guardian's Learning Bond words in English, Spanish and French (L2-163); the household's language picks one. */
export interface GuardianLearningBondText {
  pageTitle: string;
  loading: string;
  heading: (names: string, many: boolean) => string;
  kids: string;
  upTo: (amount: string) => string;
  selfClaim: (name: string) => string;
  continue: string;
  notNow: string;
  notInterested: string;
  about: string;
  notNowTitle: string;
  notNowText: string;
  notInterestedTitle: string;
  notInterestedText: string;
  verifyHeading: string;
  verifyText: string;
  contactLabel: string;
  sendCode: string;
  codeHeading: string;
  codeText: string;
  codeLabel: string;
  differentContact: string;
  locked: string;
  expiredHeading: string;
  expiredText: (organization: string) => string;
  errorTitle: string;
  errorText: string;
  tryAgain: string;
  failed: string;
  and: string;
  amount: (dollars: number) => string;
}

const en: GuardianLearningBondText = {
  pageTitle: 'Learning Bond for your family',
  loading: 'Loading your family’s page',
  heading: (names) => `${names} may be owed money for school after high school`,
  kids: 'Your children',
  upTo: (amount) => `Up to ${amount}`,
  selfClaim: (name) => `${name} can claim the Learning Bond for themselves until they turn 21.`,
  continue: 'Continue',
  notNow: 'Not now',
  notInterested: 'I’m not interested',
  about: 'About 15 minutes · nothing to pay · on this phone',
  notNowTitle: 'Your link keeps working',
  notNowText: 'Come back any time. Nothing was collected.',
  notInterestedTitle: 'We won’t text you about the Learning Bond again.',
  notInterestedText: 'If you change your mind, this link still opens the claim.',
  verifyHeading: 'Check it’s you',
  verifyText: 'This page holds your family’s private details, so we text a code first.',
  contactLabel: 'Your mobile number or email',
  sendCode: 'Send the code',
  codeHeading: 'Check it’s you',
  codeText: 'Enter the 6-digit code we sent. It’s valid for 10 minutes.',
  codeLabel: '6-digit code',
  differentContact: 'Use a different number or email',
  locked: 'Too many tries. Try again in 15 minutes.',
  expiredHeading: 'This link has expired',
  expiredText: (organization) => `Ask ${organization} for a new one.`,
  errorTitle: 'We couldn’t load your family’s page',
  errorText: 'Your answers are saved and nothing was lost. Try again.',
  tryAgain: 'Try again',
  failed: 'That didn’t go through. Try again.',
  and: 'and',
  amount: (dollars) => `$${dollars.toLocaleString('en-CA')}`,
};

const es: GuardianLearningBondText = {
  pageTitle: 'El Bono de Estudios para su familia',
  loading: 'Cargando la página de su familia',
  heading: (names, many) =>
    `${names} ${many ? 'podrían' : 'podría'} tener derecho a dinero para estudiar después de la secundaria`,
  kids: 'Sus hijos',
  upTo: (amount) => `Hasta ${amount}`,
  selfClaim: (name) => `${name} puede solicitar el Bono por su cuenta hasta cumplir 21 años.`,
  continue: 'Continuar',
  notNow: 'Ahora no',
  notInterested: 'No me interesa',
  about: 'Unos 15 minutos · sin costo · en este teléfono',
  notNowTitle: 'Su enlace sigue funcionando',
  notNowText: 'Vuelva cuando quiera. No se recopiló nada.',
  notInterestedTitle: 'No le volveremos a escribir sobre el Bono de Estudios.',
  notInterestedText: 'Si cambia de opinión, este enlace sigue abriendo la solicitud.',
  verifyHeading: 'Confirme que es usted',
  verifyText:
    'Esta página tiene datos privados de su familia, así que primero le enviamos un código.',
  contactLabel: 'Su número de celular o correo',
  sendCode: 'Enviar el código',
  codeHeading: 'Confirme que es usted',
  codeText: 'Escriba el código de 6 dígitos que le enviamos. Vale por 10 minutos.',
  codeLabel: 'Código de 6 dígitos',
  differentContact: 'Usar otro número o correo',
  locked: 'Demasiados intentos. Vuelva a intentarlo en 15 minutos.',
  expiredHeading: 'Este enlace venció',
  expiredText: (organization) => `Pida uno nuevo a ${organization}.`,
  errorTitle: 'No pudimos cargar la página de su familia',
  errorText: 'Sus respuestas están guardadas y no se perdió nada. Inténtelo de nuevo.',
  tryAgain: 'Intentar de nuevo',
  failed: 'No se pudo. Inténtelo de nuevo.',
  and: 'y',
  amount: (dollars) => `$${dollars.toLocaleString('en-CA')}`,
};

const fr: GuardianLearningBondText = {
  pageTitle: 'Le Bon d’études pour votre famille',
  loading: 'Chargement de la page de votre famille',
  heading: (names, many) =>
    `${names} ${many ? 'pourraient' : 'pourrait'} avoir droit à de l’argent pour ${many ? 'leurs' : 'ses'} études après le secondaire`,
  kids: 'Vos enfants',
  upTo: (amount) => `Jusqu’à ${amount}`,
  selfClaim: (name) => `${name} peut demander le Bon d’études jusqu’à ses 21 ans.`,
  continue: 'Continuer',
  notNow: 'Pas maintenant',
  notInterested: 'Ça ne m’intéresse pas',
  about: 'Environ 15 minutes · rien à payer · sur ce téléphone',
  notNowTitle: 'Votre lien fonctionne toujours',
  notNowText: 'Revenez quand vous voulez. Rien n’a été recueilli.',
  notInterestedTitle: 'Nous ne vous écrirons plus au sujet du Bon d’études.',
  notInterestedText: 'Si vous changez d’avis, ce lien ouvre toujours la demande.',
  verifyHeading: 'Confirmez que c’est vous',
  verifyText:
    'Cette page contient les renseignements privés de votre famille; nous envoyons d’abord un code.',
  contactLabel: 'Votre numéro de cellulaire ou courriel',
  sendCode: 'Envoyer le code',
  codeHeading: 'Confirmez que c’est vous',
  codeText: 'Entrez le code à 6 chiffres que nous avons envoyé. Il est valide 10 minutes.',
  codeLabel: 'Code à 6 chiffres',
  differentContact: 'Utiliser un autre numéro ou courriel',
  locked: 'Trop d’essais. Réessayez dans 15 minutes.',
  expiredHeading: 'Ce lien a expiré',
  expiredText: (organization) => `Demandez-en un nouveau à ${organization}.`,
  errorTitle: 'Nous n’avons pas pu charger la page de votre famille',
  errorText: 'Vos réponses sont enregistrées et rien n’a été perdu. Réessayez.',
  tryAgain: 'Réessayer',
  failed: 'Cela n’a pas fonctionné. Réessayez.',
  and: 'et',
  amount: (dollars) => `${dollars.toLocaleString('fr-CA')} $`,
};

/** The words for a household language code; English when it has none. */
export function guardianLearningBondText(code: string): GuardianLearningBondText {
  return code === 'es' ? es : code === 'fr' ? fr : en;
}
