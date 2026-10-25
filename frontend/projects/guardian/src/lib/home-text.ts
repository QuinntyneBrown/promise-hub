import { GuardianLanguage } from './guardian-text';

/** The guardian home's strings in English, Spanish and French (L2-027). */
const TEXT = {
  en: {
    heading: (name: string) => `Hi ${name}`,
    intro: (org: string) => `Where your children stand at ${org}.`,
    list: 'Your children’s enrollments',
    enrolled: 'Enrolled',
    waiting: 'Waiting review',
    waitlisted: (n: number) => `Waitlist #${n}`,
    declined: 'Not enrolled',
    enrolledMeta: (date: string) => `Enrolled · starts ${date}.`,
    waitingMeta: 'Waiting for review. We’ll text you when it’s decided.',
    waitlistedMeta: (n: number) =>
      `Number ${n} on the waitlist. We’ll text you first if a place opens.`,
    declinedMeta: (reason: string) => `Not enrolled: ${reason}`,
    none: 'No enrollments yet. Enroll from the link the program sends.',
  },
  es: {
    heading: (name: string) => `Hola, ${name}`,
    intro: (org: string) => `Así van sus hijos en ${org}.`,
    list: 'Inscripciones de sus hijos',
    enrolled: 'Inscrito',
    waiting: 'En revisión',
    waitlisted: (n: number) => `Lista de espera #${n}`,
    declined: 'No inscrito',
    enrolledMeta: (date: string) => `Inscrito · empieza el ${date}.`,
    waitingMeta: 'En revisión. Le enviaremos un mensaje cuando se decida.',
    waitlistedMeta: (n: number) =>
      `Número ${n} en la lista de espera. Le avisaremos primero si se abre un lugar.`,
    declinedMeta: (reason: string) => `No inscrito: ${reason}`,
    none: 'Todavía no hay inscripciones. Inscríbase con el enlace que envía el programa.',
  },
  fr: {
    heading: (name: string) => `Bonjour ${name}`,
    intro: (org: string) => `Où en sont vos enfants chez ${org}.`,
    list: 'Inscriptions de vos enfants',
    enrolled: 'Inscrit',
    waiting: 'En examen',
    waitlisted: (n: number) => `Liste d’attente no ${n}`,
    declined: 'Non inscrit',
    enrolledMeta: (date: string) => `Inscrit · commence le ${date}.`,
    waitingMeta: 'En examen. Nous vous écrirons quand ce sera décidé.',
    waitlistedMeta: (n: number) =>
      `Numéro ${n} sur la liste d’attente. Nous vous écrirons en premier si une place se libère.`,
    declinedMeta: (reason: string) => `Non inscrit : ${reason}`,
    none: 'Aucune inscription pour l’instant. Inscrivez-vous avec le lien envoyé par le programme.',
  },
} as const;

export type HomeText = (typeof TEXT)['en'];

export function homeText(language: GuardianLanguage): HomeText {
  return TEXT[language] as HomeText;
}
