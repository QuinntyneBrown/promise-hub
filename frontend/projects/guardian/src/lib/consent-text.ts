import { GuardianLanguage } from './guardian-text';

/** The consent relationships the server stores, in this order; each page shows them in its language. */
export const RELATIONSHIPS = [
  'Parent',
  'Legal guardian',
  'Grandparent',
  'Other caregiver',
] as const;

/** Every consent page string in English, Spanish and French (L2-027). The wording itself is shown as the organization wrote it. */
const TEXT = {
  en: {
    heading: (child: string) => `Consent for ${child}`,
    intro: (name: string, child: string, org: string, age: number) =>
      `Hi ${name}. ${child} asked to start Learning and mentoring at ${org}. Because they’re under ${age}, a guardian consents first.`,
    what: 'What you’re agreeing to',
    withdrawAnyTime: 'You can withdraw consent at any time from this link.',
    englishBinding: '',
    about: (child: string) => `About ${child}`,
    youth: 'Youth',
    organization: 'Organization',
    sign: 'Sign',
    relationshipLabel: (child: string) => `How you’re related to ${child}`,
    choose: 'Choose…',
    relationships: {
      Parent: 'Parent',
      'Legal guardian': 'Legal guardian',
      Grandparent: 'Grandparent',
      'Other caregiver': 'Other caregiver',
    } as Record<string, string>,
    consentLegend: 'Consent',
    agree: (child: string) => `I consent to ${child} taking part`,
    nameLabel: 'Type your full name to sign',
    nameHelp:
      'Typing your name is your signature. We keep the time, this device and the wording you read.',
    give: 'Give consent',
    failed: 'We couldn’t save your consent',
    failedText: 'Your answers are kept. Try again.',
    signedHeading: (name: string) => `Consent given. Thank you, ${name}`,
    signedText: (child: string) => `${child} can start Learning now.`,
    givenHeading: 'Consent already given',
    givenText: (child: string) => `${child} can use Learning.`,
    record: 'Your consent record',
    signedBy: 'Signed by',
    when: 'When',
    method: 'Method',
    typed: 'Typed signature',
    reference: 'Reference',
    withdraw: 'Withdraw consent',
    withdrawnHeading: 'Consent withdrawn',
    withdrawnTitle: (child: string) => `${child} can’t use Learning now`,
    withdrawnText: (by: string, when: string) => `Withdrawn by ${by} on ${when}. Staff can see it.`,
    withdrawTitle: (child: string) => `Withdraw consent for ${child}?`,
    withdrawText: (child: string) =>
      `${child} can’t use Learning until a guardian consents again. Staff can see it.`,
    withdrawKeep: 'Your consent record stays; the withdrawal is added to it with the time.',
    cancel: 'Cancel',
  },
  es: {
    heading: (child: string) => `Consentimiento para ${child}`,
    intro: (name: string, child: string, org: string, age: number) =>
      `Hola ${name}. ${child} pidió empezar Learning y la mentoría en ${org}. Como tiene menos de ${age} años, primero da su consentimiento un tutor.`,
    what: 'Lo que acepta',
    withdrawAnyTime: 'Puede retirar su consentimiento en cualquier momento desde este enlace.',
    englishBinding: 'El texto en inglés es el que firma.',
    about: (child: string) => `Sobre ${child}`,
    youth: 'Joven',
    organization: 'Organización',
    sign: 'Firmar',
    relationshipLabel: (child: string) => `Su relación con ${child}`,
    choose: 'Elija…',
    relationships: {
      Parent: 'Madre o padre',
      'Legal guardian': 'Tutor legal',
      Grandparent: 'Abuela o abuelo',
      'Other caregiver': 'Otro cuidador',
    } as Record<string, string>,
    consentLegend: 'Consentimiento',
    agree: (child: string) => `Doy mi consentimiento para que ${child} participe`,
    nameLabel: 'Escriba su nombre completo para firmar',
    nameHelp:
      'Escribir su nombre es su firma. Guardamos la hora, este dispositivo y el texto que leyó.',
    give: 'Dar consentimiento',
    failed: 'No pudimos guardar su consentimiento',
    failedText: 'Sus respuestas se conservan. Inténtelo de nuevo.',
    signedHeading: (name: string) => `Consentimiento dado. Gracias, ${name}`,
    signedText: (child: string) => `${child} ya puede empezar Learning.`,
    givenHeading: 'Consentimiento ya dado',
    givenText: (child: string) => `${child} puede usar Learning.`,
    record: 'Su registro de consentimiento',
    signedBy: 'Firmado por',
    when: 'Cuándo',
    method: 'Método',
    typed: 'Firma escrita',
    reference: 'Referencia',
    withdraw: 'Retirar el consentimiento',
    withdrawnHeading: 'Consentimiento retirado',
    withdrawnTitle: (child: string) => `${child} no puede usar Learning ahora`,
    withdrawnText: (by: string, when: string) =>
      `Retirado por ${by} el ${when}. El personal puede verlo.`,
    withdrawTitle: (child: string) => `¿Retirar el consentimiento para ${child}?`,
    withdrawText: (child: string) =>
      `${child} no podrá usar Learning hasta que un tutor vuelva a dar su consentimiento. El personal puede verlo.`,
    withdrawKeep: 'Su registro se conserva; el retiro se añade con la hora.',
    cancel: 'Cancelar',
  },
  fr: {
    heading: (child: string) => `Consentement pour ${child}`,
    intro: (name: string, child: string, org: string, age: number) =>
      `Bonjour ${name}. ${child} a demandé à commencer Learning et le mentorat chez ${org}. Comme cette personne a moins de ${age} ans, un tuteur consent d’abord.`,
    what: 'Ce que vous acceptez',
    withdrawAnyTime: 'Vous pouvez retirer votre consentement en tout temps à partir de ce lien.',
    englishBinding: 'Le texte anglais est celui que vous signez.',
    about: (child: string) => `À propos de ${child}`,
    youth: 'Jeune',
    organization: 'Organisme',
    sign: 'Signer',
    relationshipLabel: (child: string) => `Votre lien avec ${child}`,
    choose: 'Choisissez…',
    relationships: {
      Parent: 'Parent',
      'Legal guardian': 'Tuteur légal',
      Grandparent: 'Grand-parent',
      'Other caregiver': 'Autre personne responsable',
    } as Record<string, string>,
    consentLegend: 'Consentement',
    agree: (child: string) => `Je consens à ce que ${child} participe`,
    nameLabel: 'Tapez votre nom complet pour signer',
    nameHelp:
      'Taper votre nom vaut signature. Nous gardons l’heure, cet appareil et le texte que vous avez lu.',
    give: 'Donner mon consentement',
    failed: 'Nous n’avons pas pu enregistrer votre consentement',
    failedText: 'Vos réponses sont conservées. Réessayez.',
    signedHeading: (name: string) => `Consentement donné. Merci, ${name}`,
    signedText: (child: string) => `${child} peut commencer Learning maintenant.`,
    givenHeading: 'Consentement déjà donné',
    givenText: (child: string) => `${child} peut utiliser Learning.`,
    record: 'Votre dossier de consentement',
    signedBy: 'Signé par',
    when: 'Quand',
    method: 'Méthode',
    typed: 'Signature tapée',
    reference: 'Référence',
    withdraw: 'Retirer mon consentement',
    withdrawnHeading: 'Consentement retiré',
    withdrawnTitle: (child: string) => `${child} ne peut pas utiliser Learning maintenant`,
    withdrawnText: (by: string, when: string) =>
      `Retiré par ${by} le ${when}. Le personnel peut le voir.`,
    withdrawTitle: (child: string) => `Retirer le consentement pour ${child}?`,
    withdrawText: (child: string) =>
      `${child} ne pourra pas utiliser Learning tant qu’un tuteur ne consent pas de nouveau. Le personnel peut le voir.`,
    withdrawKeep: 'Votre dossier reste; le retrait y est ajouté avec l’heure.',
    cancel: 'Annuler',
  },
};

export type ConsentText = (typeof TEXT)['en'];

export function consentText(language: GuardianLanguage): ConsentText {
  return TEXT[language] as ConsentText;
}
