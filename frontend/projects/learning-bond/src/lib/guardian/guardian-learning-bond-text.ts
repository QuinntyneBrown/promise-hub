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
  consentHeading: string;
  children: string;
  typedName: string;
  agree: string;
  fixFirst: string;
  thanks: (name: string) => string;
  consentRecorded: (names: string) => string;
  consentRecordedText: string;
  toDetails: (name: string) => string;
  allConsented: string;
  intakeHeading: (name: string) => string;
  recordTitle: string;
  recordRight: string;
  fixThis: string;
  confirmed: string;
  yourSin: string;
  childSin: (name: string) => string;
  sinHelp: string;
  saved: string;
  change: string;
  taxQuestion: (year: number) => string;
  yes: string;
  no: string;
  notSure: string;
  saveAndContinue: string;
  intakeSaved: string;
  next: string;
  fixLabel: string;
  fixSend: (organization: string) => string;
  fixCancel: string;
  fixTitle: (name: string) => string;
  fixRequested: (organization: string, name: string) => string;
}

const en: GuardianLearningBondText = {
  intakeHeading: (name) => `${name}’s details`,
  recordTitle: 'On the enrolment record',
  recordRight: 'Yes, that’s right',
  fixThis: 'Fix this',
  confirmed: 'Thanks. I won’t ask for these again.',
  yourSin: 'Your SIN',
  childSin: (name) => `${name}’s SIN`,
  sinHelp: '9 digits, like 123 456 782. Only the last 3 digits show once saved.',
  saved: 'Saved. Only the last 3 digits are shown.',
  change: 'Change',
  taxQuestion: (year) => `Did your family file a ${year} tax return?`,
  yes: 'Yes',
  no: 'No',
  notSure: 'Not sure',
  saveAndContinue: 'Save and continue',
  intakeSaved: 'Saved. Nothing has been sent yet.',
  next: 'See the estimate',
  fixLabel: 'What should we fix?',
  fixSend: (organization) => `Send to ${organization}`,
  fixCancel: 'Cancel',
  fixTitle: (name) => `Fix ${name}’s record`,
  fixRequested: (organization, name) =>
    `We asked ${organization} to fix ${name}’s record. We’ll text you when it’s done.`,
  consentHeading: 'Your permission, for each child',
  children: 'Children',
  typedName: 'Type your full name to sign',
  agree: 'Agree',
  fixFirst: 'Fix this first',
  thanks: (name) => `Thanks, ${name}`,
  consentRecorded: (names) => `Consent recorded for ${names}`,
  consentRecordedText: 'You can withdraw it any time from your family page.',
  toDetails: (name) => `Continue to ${name}’s details`,
  allConsented: 'You’ve given consent for every child who can claim.',
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
  intakeHeading: (name) => `Los datos de ${name}`,
  recordTitle: 'En el registro de inscripción',
  recordRight: 'Sí, es correcto',
  fixThis: 'Corregir esto',
  confirmed: 'Gracias. No se lo volveré a preguntar.',
  yourSin: 'Su NAS',
  childSin: (name) => `El NAS de ${name}`,
  sinHelp: '9 dígitos, como 123 456 782. Al guardar solo se ven los últimos 3.',
  saved: 'Guardado. Solo se ven los últimos 3 dígitos.',
  change: 'Cambiar',
  taxQuestion: (year) => `¿Su familia presentó la declaración de impuestos de ${year}?`,
  yes: 'Sí',
  no: 'No',
  notSure: 'No estoy seguro',
  saveAndContinue: 'Guardar y continuar',
  intakeSaved: 'Guardado. Todavía no se envió nada.',
  next: 'Ver la estimación',
  fixLabel: '¿Qué debemos corregir?',
  fixSend: (organization) => `Enviar a ${organization}`,
  fixCancel: 'Cancelar',
  fixTitle: (name) => `Corregir el registro de ${name}`,
  fixRequested: (organization, name) =>
    `Pedimos a ${organization} que corrija el registro de ${name}. Le avisaremos cuando esté listo.`,
  consentHeading: 'Su permiso, por cada hijo',
  children: 'Hijos',
  typedName: 'Escriba su nombre completo para firmar',
  agree: 'Acepto',
  fixFirst: 'Corrija esto primero',
  thanks: (name) => `Gracias, ${name}`,
  consentRecorded: (names) => `Consentimiento registrado para ${names}`,
  consentRecordedText: 'Puede retirarlo cuando quiera desde la página de su familia.',
  toDetails: (name) => `Continuar con los datos de ${name}`,
  allConsented: 'Ya dio su consentimiento para todos los hijos que pueden solicitarlo.',
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
  intakeHeading: (name) => `Les renseignements de ${name}`,
  recordTitle: 'Au dossier d’inscription',
  recordRight: 'Oui, c’est exact',
  fixThis: 'Corriger',
  confirmed: 'Merci. Je ne vous le redemanderai pas.',
  yourSin: 'Votre NAS',
  childSin: (name) => `Le NAS de ${name}`,
  sinHelp: '9 chiffres, comme 123 456 782. Seuls les 3 derniers s’affichent une fois enregistré.',
  saved: 'Enregistré. Seuls les 3 derniers chiffres s’affichent.',
  change: 'Modifier',
  taxQuestion: (year) => `Votre famille a-t-elle produit une déclaration de revenus ${year} ?`,
  yes: 'Oui',
  no: 'Non',
  notSure: 'Je ne sais pas',
  saveAndContinue: 'Enregistrer et continuer',
  intakeSaved: 'Enregistré. Rien n’a encore été envoyé.',
  next: 'Voir l’estimation',
  fixLabel: 'Que devons-nous corriger ?',
  fixSend: (organization) => `Envoyer à ${organization}`,
  fixCancel: 'Annuler',
  fixTitle: (name) => `Corriger le dossier de ${name}`,
  fixRequested: (organization, name) =>
    `Nous avons demandé à ${organization} de corriger le dossier de ${name}. Nous vous écrirons quand ce sera fait.`,
  consentHeading: 'Votre permission, pour chaque enfant',
  children: 'Enfants',
  typedName: 'Tapez votre nom complet pour signer',
  agree: 'J’accepte',
  fixFirst: 'Corrigez ceci d’abord',
  thanks: (name) => `Merci, ${name}`,
  consentRecorded: (names) => `Consentement enregistré pour ${names}`,
  consentRecordedText: 'Vous pouvez le retirer en tout temps depuis la page de votre famille.',
  toDetails: (name) => `Continuer avec les renseignements de ${name}`,
  allConsented: 'Vous avez donné votre consentement pour chaque enfant admissible.',
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
