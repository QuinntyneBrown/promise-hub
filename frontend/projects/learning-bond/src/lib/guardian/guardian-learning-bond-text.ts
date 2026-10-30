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
  /** The agent bubble's speaker name, read by screen readers (L2-163). */
  speaker: string;
  estimateHeading: (name: string, amount: string) => string;
  estimateNote: (name: string) => string;
  bornBefore: (name: string) => string;
  taxReturnTitle: string;
  taxReturnText: (name: string) => string;
  toReview: (name: string) => string;
  backToDetails: string;
  reviewHeading: (name: string) => string;
  providerTitle: string;
  recommended: string;
  chooseAnother: string;
  chooseTitle: string;
  chooseLegend: string;
  useProvider: string;
  cancel: string;
  save: string;
  applicationTitle: string;
  fieldName: string;
  fieldBirth: string;
  fieldChildSin: (name: string) => string;
  fieldCaregiver: string;
  fieldAddress: string;
  fieldGuardianSin: string;
  fieldPhone: string;
  fieldEmail: string;
  fieldLanguage: string;
  edit: (label: string) => string;
  editButton: string;
  editTitle: (label: string) => string;
  editHint: string;
  addAddress: string;
  sendsTo: (name: string, provider: string) => string;
  submitTo: (provider: string) => string;
  sentTitle: (name: string, provider: string) => string;
  sentText: string;
  notSentTitle: string;
  notSentText: (provider: string) => string;
  staleTitle: string;
  noProviderHeading: string;
  noProviderText: string;
}

const en: GuardianLearningBondText = {
  speaker: 'Learning Bond',
  reviewHeading: (name) => `Check ${name}’s application`,
  providerTitle: 'RESP provider',
  recommended: 'Recommended',
  chooseAnother: 'Choose another',
  chooseTitle: 'Choose a provider',
  chooseLegend: 'No-fee RESP providers that administer the Learning Bond',
  useProvider: 'Use this provider',
  cancel: 'Cancel',
  save: 'Save',
  applicationTitle: 'RESP and Learning Bond application',
  fieldName: 'Name',
  fieldBirth: 'Date of birth',
  fieldChildSin: (name) => `${name}’s SIN`,
  fieldCaregiver: 'Primary caregiver',
  fieldAddress: 'Address',
  fieldGuardianSin: 'Your SIN',
  fieldPhone: 'Phone',
  fieldEmail: 'Email',
  fieldLanguage: 'Language',
  edit: (label) => `Edit ${label}`,
  editButton: 'Edit',
  editTitle: (label) => `Change ${label.toLowerCase()}`,
  editHint: 'For this application only. Your family’s record isn’t changed.',
  addAddress: 'Add your address before you submit.',
  sendsTo: (name, provider) =>
    `This sends ${name}’s application to ${provider} and the Government of Canada.`,
  submitTo: (provider) => `Submit to ${provider}`,
  sentTitle: (name, provider) => `${name}’s application went to ${provider}.`,
  sentText: 'We’ll text you when it’s received. Nothing else for you to do now.',
  notSentTitle: 'We couldn’t send it. Nothing was sent. Try again.',
  notSentText: (provider) =>
    `${provider} didn’t answer. Your application is saved exactly as you reviewed it.`,
  staleTitle: 'The application changed since you opened it. Check it again, then submit.',
  noProviderHeading: 'No provider yet for your province',
  noProviderText:
    'None of the no-fee providers we work with serves your province yet. Your claim stays saved.',
  estimateHeading: (name, amount) => `${name} may be owed up to ${amount}.`,
  estimateNote: (name) =>
    `Based on the years since ${name} was born. The Government of Canada confirms the amount from your tax returns.`,
  bornBefore: (name) => `${name} was born before 2004, so the Learning Bond doesn’t apply.`,
  taxReturnTitle: 'You’ll need to file to receive it',
  taxReturnText: (name) =>
    `The Learning Bond is based on your family’s income. Once last year’s tax return is filed, ${name}’s claim carries on from here.`,
  toReview: (name) => `Review ${name}’s application`,
  backToDetails: 'Back to the details',
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
  speaker: 'Bono de Estudios',
  reviewHeading: (name) => `Revise la solicitud de ${name}`,
  providerTitle: 'Proveedor del RESP',
  recommended: 'Recomendado',
  chooseAnother: 'Elegir otro',
  chooseTitle: 'Elija un proveedor',
  chooseLegend: 'Proveedores de RESP sin comisiones que gestionan el Bono de Estudios',
  useProvider: 'Usar este proveedor',
  cancel: 'Cancelar',
  save: 'Guardar',
  applicationTitle: 'Solicitud de RESP y Bono de Estudios',
  fieldName: 'Nombre',
  fieldBirth: 'Fecha de nacimiento',
  fieldChildSin: (name) => `SIN de ${name}`,
  fieldCaregiver: 'Cuidador principal',
  fieldAddress: 'Dirección',
  fieldGuardianSin: 'Su SIN',
  fieldPhone: 'Teléfono',
  fieldEmail: 'Correo',
  fieldLanguage: 'Idioma',
  edit: (label) => `Editar ${label}`,
  editButton: 'Editar',
  editTitle: (label) => `Cambiar ${label.toLowerCase()}`,
  editHint: 'Solo para esta solicitud. El registro de su familia no cambia.',
  addAddress: 'Agregue su dirección antes de enviar.',
  sendsTo: (name, provider) =>
    `Esto envía la solicitud de ${name} a ${provider} y al Gobierno de Canadá.`,
  submitTo: (provider) => `Enviar a ${provider}`,
  sentTitle: (name, provider) => `La solicitud de ${name} se envió a ${provider}.`,
  sentText: 'Le enviaremos un mensaje cuando la reciban. No tiene que hacer nada más por ahora.',
  notSentTitle: 'No pudimos enviarla. No se envió nada. Inténtelo de nuevo.',
  notSentText: (provider) =>
    `${provider} no respondió. Su solicitud está guardada tal como la revisó.`,
  staleTitle: 'La solicitud cambió desde que la abrió. Revísela otra vez y envíela.',
  noProviderHeading: 'Todavía no hay proveedor para su provincia',
  noProviderText:
    'Ninguno de los proveedores sin comisiones con los que trabajamos atiende su provincia todavía. Su solicitud queda guardada.',
  estimateHeading: (name, amount) => `${name} podría tener derecho a hasta ${amount}.`,
  estimateNote: (name) =>
    `Según los años desde que nació ${name}. El Gobierno de Canadá confirma el monto con sus declaraciones de impuestos.`,
  bornBefore: (name) => `${name} nació antes de 2004, así que el Bono de Estudios no aplica.`,
  taxReturnTitle: 'Tendrá que presentar la declaración para recibirlo',
  taxReturnText: (name) =>
    `El Bono depende de los ingresos de su familia. Cuando presente la declaración del año pasado, la solicitud de ${name} sigue desde aquí.`,
  toReview: (name) => `Revisar la solicitud de ${name}`,
  backToDetails: 'Volver a los datos',
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
  speaker: 'Bon d’études',
  reviewHeading: (name) => `Vérifiez la demande de ${name}`,
  providerTitle: 'Fournisseur du REEE',
  recommended: 'Recommandé',
  chooseAnother: 'En choisir un autre',
  chooseTitle: 'Choisir un fournisseur',
  chooseLegend: 'Fournisseurs de REEE sans frais qui gèrent le Bon d’études',
  useProvider: 'Utiliser ce fournisseur',
  cancel: 'Annuler',
  save: 'Enregistrer',
  applicationTitle: 'Demande de REEE et de Bon d’études',
  fieldName: 'Nom',
  fieldBirth: 'Date de naissance',
  fieldChildSin: (name) => `NAS de ${name}`,
  fieldCaregiver: 'Principal responsable',
  fieldAddress: 'Adresse',
  fieldGuardianSin: 'Votre NAS',
  fieldPhone: 'Téléphone',
  fieldEmail: 'Courriel',
  fieldLanguage: 'Langue',
  edit: (label) => `Modifier ${label}`,
  editButton: 'Modifier',
  editTitle: (label) => `Modifier ${label.toLowerCase()}`,
  editHint: 'Pour cette demande seulement. Le dossier de votre famille ne change pas.',
  addAddress: 'Ajoutez votre adresse avant d’envoyer.',
  sendsTo: (name, provider) =>
    `Ceci envoie la demande de ${name} à ${provider} et au gouvernement du Canada.`,
  submitTo: (provider) => `Envoyer à ${provider}`,
  sentTitle: (name, provider) => `La demande de ${name} a été envoyée à ${provider}.`,
  sentText:
    'Nous vous écrirons quand elle sera reçue. Vous n’avez rien d’autre à faire pour l’instant.',
  notSentTitle: 'Nous n’avons pas pu l’envoyer. Rien n’a été envoyé. Réessayez.',
  notSentText: (provider) =>
    `${provider} n’a pas répondu. Votre demande est enregistrée telle que vous l’avez vérifiée.`,
  staleTitle:
    'La demande a changé depuis que vous l’avez ouverte. Vérifiez-la de nouveau, puis envoyez-la.',
  noProviderHeading: 'Pas encore de fournisseur pour votre province',
  noProviderText:
    'Aucun des fournisseurs sans frais avec qui nous travaillons ne sert encore votre province. Votre demande reste enregistrée.',
  estimateHeading: (name, amount) => `${name} pourrait recevoir jusqu’à ${amount}.`,
  estimateNote: (name) =>
    `Selon les années depuis la naissance de ${name}. Le gouvernement du Canada confirme le montant à partir de vos déclarations de revenus.`,
  bornBefore: (name) => `${name} est né avant 2004 : le Bon d’études ne s’applique pas.`,
  taxReturnTitle: 'Vous devrez produire votre déclaration pour le recevoir',
  taxReturnText: (name) =>
    `Le Bon dépend du revenu de votre famille. Une fois la déclaration de l’an dernier produite, la demande de ${name} reprend ici.`,
  toReview: (name) => `Vérifier la demande de ${name}`,
  backToDetails: 'Retour aux renseignements',
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
