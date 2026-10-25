import { GuardianLanguage } from './guardian-text';

/** The guardian home's strings in English, Spanish and French (L2-027). */
const TEXT = {
  en: {
    noShow: (names: string[], event: string) =>
      `${names.join(' and ')} ${names.length === 1 ? 'isn’t' : 'aren’t'} checked in at ${event} yet`,
    noShowText: (time: string) => `It started at ${time}. Let staff know.`,
    onTheWay: 'On the way',
    absent: 'Absent tonight',
    answeredOnTheWay: 'Thanks. Staff can see they’re on the way.',
    answeredAbsent: 'Thanks. Staff can see they’re absent tonight.',
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
    noShow: (names: string[], event: string) =>
      `${names.join(' y ')} ${names.length === 1 ? 'no se ha registrado' : 'no se han registrado'} en ${event}`,
    noShowText: (time: string) => `Empezó a las ${time}. Avise al personal.`,
    onTheWay: 'En camino',
    absent: 'Ausente hoy',
    answeredOnTheWay: 'Gracias. El personal ve que van en camino.',
    answeredAbsent: 'Gracias. El personal ve que faltan hoy.',
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
    noShow: (names: string[], event: string) =>
      `${names.join(' et ')} ${names.length === 1 ? 'n’est pas enregistré' : 'ne sont pas enregistrés'} à ${event}`,
    noShowText: (time: string) => `C’est commencé à ${time}. Prévenez l’équipe.`,
    onTheWay: 'En route',
    absent: 'Absent ce soir',
    answeredOnTheWay: 'Merci. L’équipe voit qu’ils sont en route.',
    answeredAbsent: 'Merci. L’équipe voit qu’ils sont absents ce soir.',
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
