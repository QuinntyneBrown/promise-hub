/** The benefits check's words in English, Spanish and French (L2-153 to L2-156, L2-163). */
export interface GuardianBenefitsText {
  offerTitle: string;
  offerText: string;
  check: string;
  notNow: string;
  yourBenefits: string;
  consentHeading: string;
  consentLead: string;
  typedName: string;
  agree: string;
  tickToAgree: string;
  intakeHeading: string;
  householdTitle: string;
  sizeLabel: string;
  maritalLabel: string;
  marital: Record<string, string>;
  ccbLegend: string;
  incomeLegend: string;
  incomeHint: string;
  yes: string;
  no: string;
  notSure: string;
  claimsLegend: (name: string) => string;
  claims: Record<string, string>;
  claimsHint: string;
  checkMine: string;
  listHeading: string;
  states: Record<string, string>;
  yearly: (amount: string) => string;
  varies: string;
  needs: (program: string, document: string) => string;
  attached: (document: string, file: string) => string;
  upload: (document: string) => string;
  applyNow: string;
  ruleOf: (source: string, version: string) => string;
  alreadyTitle: string;
  allReceived: string;
  allReceivedText: string;
  reviewHeading: (program: string) => string;
  applicationTitle: (program: string) => string;
  fields: Record<string, string>;
  sendsOnly: (program: string) => string;
  submitTo: (program: string) => string;
  sentTo: (program: string) => string;
  sentText: string;
  sendYourself: string;
  attach: string;
  sendTo: string;
  download: string;
  markSent: string;
  markedSent: string;
  markedSentText: (program: string) => string;
  backToBenefits: string;
}

const en: GuardianBenefitsText = {
  offerTitle: 'Child benefits',
  offerText:
    'I can also check whether your family gets every child benefit it qualifies for. It takes about 3 questions.',
  check: 'Check benefits',
  notNow: 'Not now',
  yourBenefits: 'Your benefits',
  consentHeading: 'Your permission for the benefits check',
  consentLead: 'Benefit details need a consent of their own, separate from the Learning Bond.',
  typedName: 'Type your full name to sign',
  agree: 'Agree',
  tickToAgree: 'Tick the box to agree.',
  intakeHeading: 'Three questions',
  householdTitle: 'About your household',
  sizeLabel: 'How many people live with you, including you and your children?',
  maritalLabel: 'Your marital status',
  marital: {
    Married: 'Married',
    CommonLaw: 'Common-law',
    Separated: 'Separated',
    Divorced: 'Divorced',
    Widowed: 'Widowed',
    Single: 'Single',
  },
  ccbLegend: 'Do you get the Canada Child Benefit now?',
  incomeLegend: 'Has your income changed a lot since your last tax return?',
  incomeHint: 'Estimates use your last return. A big change can change them.',
  yes: 'Yes',
  no: 'No',
  notSure: 'Not sure',
  claimsLegend: (name) => `Who claims ${name}?`,
  claims: { Me: 'Me', OtherParent: 'The other parent', Shared: 'We share', NotSure: 'Not sure' },
  claimsHint: 'Benefits go to the parent who claims the child.',
  checkMine: 'Check my benefits',
  listHeading: 'Your family’s benefits',
  states: {
    ApplyNow: 'Apply now',
    NeedDocument: 'Need a document',
    NotEligible: 'Not eligible',
    AlreadyGet: 'Receiving',
    Submitted: 'Applied',
  },
  yearly: (amount) => `About ${amount} a year`,
  varies: 'Amount varies',
  needs: (program, document) =>
    `${program} needs ${document}. Upload it here; it goes only with this application.`,
  attached: (document, file) =>
    `${document.charAt(0).toUpperCase()}${document.slice(1)} attached: ${file}. Sent only with this application.`,
  upload: (document) => `Upload ${document}`,
  applyNow: 'Apply now',
  ruleOf: (source, version) => `${source} · rule ${version}`,
  alreadyTitle: 'You already get these',
  allReceived: 'You’re already getting every benefit we know about.',
  allReceivedText: 'I’ll remind you when one needs renewing.',
  reviewHeading: (program) => `Check your ${program} application`,
  applicationTitle: (program) => `${program} application`,
  fields: {
    applicantName: 'Applicant',
    applicantSin: 'Applicant’s SIN',
    maritalStatus: 'Marital status',
    householdSize: 'People in the household',
    children: 'Children',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    canadaChildBenefit: 'Canada Child Benefit',
    program: 'Program',
  },
  sendsOnly: (program) => `This sends your application to the ${program}. Only this one.`,
  submitTo: (program) => `Submit to ${program}`,
  sentTo: (program) => `Sent to the ${program}`,
  sentText: 'Once it’s confirmed, it counts in your total.',
  sendYourself: 'Send it yourself',
  attach: 'Attach',
  sendTo: 'Send to',
  download: 'Download the filled form (PDF)',
  markSent: 'Mark as sent',
  markedSent: 'Marked as sent',
  markedSentText: (program) =>
    `You sent your ${program} form. The SIN box on it is left for you to fill in.`,
  backToBenefits: 'Back to your benefits',
};

const es: GuardianBenefitsText = {
  ...en,
  offerTitle: 'Beneficios por hijos',
  offerText:
    'También puedo comprobar si su familia recibe todos los beneficios por hijos a los que tiene derecho. Son unas 3 preguntas.',
  check: 'Comprobar beneficios',
  notNow: 'Ahora no',
  yourBenefits: 'Sus beneficios',
  consentHeading: 'Su permiso para revisar beneficios',
  consentLead:
    'Los datos de beneficios necesitan un consentimiento propio, separado del Bono de Estudios.',
  typedName: 'Escriba su nombre completo para firmar',
  agree: 'Acepto',
  tickToAgree: 'Marque la casilla para aceptar.',
  intakeHeading: 'Tres preguntas',
  householdTitle: 'Sobre su hogar',
  sizeLabel: '¿Cuántas personas viven con usted, incluidos usted y sus hijos?',
  maritalLabel: 'Su estado civil',
  marital: {
    Married: 'Casada',
    CommonLaw: 'Unión de hecho',
    Separated: 'Separada',
    Divorced: 'Divorciada',
    Widowed: 'Viuda',
    Single: 'Soltera',
  },
  ccbLegend: '¿Recibe ahora el Beneficio por Hijos de Canadá?',
  incomeLegend: '¿Cambiaron mucho sus ingresos desde su última declaración?',
  incomeHint: 'Las estimaciones usan su última declaración. Un cambio grande puede cambiarlas.',
  yes: 'Sí',
  no: 'No',
  notSure: 'No sé',
  claimsLegend: (name) => `¿Quién declara a ${name}?`,
  claims: { Me: 'Yo', OtherParent: 'El otro padre', Shared: 'Compartimos', NotSure: 'No sé' },
  claimsHint: 'Los beneficios van al padre que declara al niño.',
  checkMine: 'Ver mis beneficios',
  listHeading: 'Los beneficios de su familia',
  states: {
    ApplyNow: 'Solicitar',
    NeedDocument: 'Falta un documento',
    NotEligible: 'No corresponde',
    AlreadyGet: 'Lo recibe',
    Submitted: 'Solicitado',
  },
  yearly: (amount) => `Unos ${amount} al año`,
  varies: 'El monto varía',
  applyNow: 'Solicitar',
  alreadyTitle: 'Ya recibe estos',
  allReceived: 'Ya recibe todos los beneficios que conocemos.',
  reviewHeading: (program) => `Revise su solicitud de ${program}`,
  submitTo: (program) => `Enviar a ${program}`,
  sentTo: (program) => `Enviado a ${program}`,
  sendYourself: 'Envíelo usted',
  download: 'Descargar el formulario lleno (PDF)',
  markSent: 'Marcar como enviado',
  markedSent: 'Marcado como enviado',
  backToBenefits: 'Volver a sus beneficios',
};

const fr: GuardianBenefitsText = {
  ...en,
  offerTitle: 'Prestations pour enfants',
  offerText:
    'Je peux aussi vérifier si votre famille reçoit toutes les prestations pour enfants auxquelles elle a droit. C’est environ 3 questions.',
  check: 'Vérifier les prestations',
  notNow: 'Pas maintenant',
  yourBenefits: 'Vos prestations',
  consentHeading: 'Votre permission pour la vérification des prestations',
  consentLead:
    'Les renseignements sur les prestations demandent un consentement distinct du Bon d’études.',
  typedName: 'Tapez votre nom complet pour signer',
  agree: 'J’accepte',
  tickToAgree: 'Cochez la case pour accepter.',
  intakeHeading: 'Trois questions',
  householdTitle: 'Votre ménage',
  sizeLabel: 'Combien de personnes vivent avec vous, vous et vos enfants compris?',
  maritalLabel: 'Votre état civil',
  marital: {
    Married: 'Mariée',
    CommonLaw: 'Conjointe de fait',
    Separated: 'Séparée',
    Divorced: 'Divorcée',
    Widowed: 'Veuve',
    Single: 'Célibataire',
  },
  ccbLegend: 'Recevez-vous l’Allocation canadienne pour enfants?',
  incomeLegend: 'Votre revenu a-t-il beaucoup changé depuis votre dernière déclaration?',
  incomeHint:
    'Les estimations utilisent votre dernière déclaration. Un grand changement peut les modifier.',
  yes: 'Oui',
  no: 'Non',
  notSure: 'Je ne sais pas',
  claimsLegend: (name) => `Qui déclare ${name}?`,
  claims: {
    Me: 'Moi',
    OtherParent: 'L’autre parent',
    Shared: 'Partagé',
    NotSure: 'Je ne sais pas',
  },
  checkMine: 'Voir mes prestations',
  listHeading: 'Les prestations de votre famille',
  states: {
    ApplyNow: 'Faire la demande',
    NeedDocument: 'Document requis',
    NotEligible: 'Non admissible',
    AlreadyGet: 'Reçue',
    Submitted: 'Demandée',
  },
  yearly: (amount) => `Environ ${amount} par année`,
  varies: 'Montant variable',
  applyNow: 'Faire la demande',
  alreadyTitle: 'Vous recevez déjà',
  allReceived: 'Vous recevez déjà toutes les prestations que nous connaissons.',
  reviewHeading: (program) => `Vérifiez votre demande : ${program}`,
  submitTo: (program) => `Envoyer à ${program}`,
  sentTo: (program) => `Envoyée : ${program}`,
  sendYourself: 'Envoyez-le vous-même',
  download: 'Télécharger le formulaire rempli (PDF)',
  markSent: 'Marquer comme envoyé',
  markedSent: 'Marqué comme envoyé',
  backToBenefits: 'Retour à vos prestations',
};

export function guardianBenefitsText(code: string): GuardianBenefitsText {
  return code === 'es' ? es : code === 'fr' ? fr : en;
}
