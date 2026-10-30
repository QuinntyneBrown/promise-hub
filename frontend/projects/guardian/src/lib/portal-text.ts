import { GuardianLanguage } from './guardian-text';

/** The guardian portal's strings in English, Spanish and French (L2-102 to L2-104, L2-027). Names staff wrote are shown as written. */
const TEXT = {
  en: {
    children: 'Your children',
    childrenFooter: 'See schedule, consents and progress',
    noPrograms: 'Not in a program yet',
    announcements: 'Announcements',
    newAnnouncements: (n: number, org: string) => `${n} new from ${org}.`,
    noNewAnnouncements: 'No new announcements.',
    readAnnouncements: 'Read announcements',
    learningBond: 'Learning Bond',
    openLearningBond: 'Open Learning Bond',
    learningBondLine: (name: string, status: string) =>
      ({
        Invited: `${name} may be owed money for school after high school.`,
        Started: `${name}’s claim is started.`,
        Paused: `${name}’s claim is waiting on you.`,
        Submitted: `${name}’s application was sent.`,
        Deposited: `${name}’s Learning Bond was deposited.`,
        NotCompleted: `${name}’s claim wasn’t completed.`,
      })[status] ?? '',
    back: 'Back to your family',
    childIntro: (child: string, org: string) =>
      `A read-only look at how ${child} is doing at ${org}.`,
    loadingChild: 'Loading the page',
    schedule: 'Schedule',
    scheduleFooter: 'The next four weeks.',
    nothingScheduled: 'Nothing scheduled in the next four weeks.',
    today: 'Today',
    cancelled: 'Cancelled',
    consents: 'Consents',
    nothingToSign: 'Nothing to sign right now.',
    participation: 'Taking part in Learning and mentoring',
    given: 'Given',
    withdrawn: 'Withdrawn',
    needed: 'Needed',
    signedBy: (who: string, relationship: string | null, date: string, reference: string | null) =>
      [`Signed by ${who}${relationship ? ` (${relationship})` : ''}`, date, reference]
        .filter(Boolean)
        .join(' · '),
    withdrawnBy: (who: string, date: string) => `Withdrawn by ${who} · ${date}`,
    neededText: 'We’ll send you a link to give consent.',
    signed: 'Signed',
    declined: 'Declined',
    notSigned: 'Not signed yet',
    slipSigned: (who: string, date: string) => `Signed by ${who} · ${date}`,
    slipDeclined: (who: string, date: string) => `Declined by ${who} · ${date}`,
    signBy: (date: string) => `Sign by ${date} from the link we texted you.`,
    attendance: 'Attendance',
    attendanceCaption: (attended: number, marked: number) => `${attended} of ${marked} sessions`,
    noSessions: 'No sessions marked yet.',
    marks: { Present: 'Present', Late: 'Late', Excused: 'Excused', Absent: 'Absent' },
    overall: 'Overall progress',
    overallCaption: (done: number, total: number) => `${done} of ${total} lessons`,
    badges: 'Badges',
    badgesCaption: (total: number) => `of ${total} badges`,
    modules: 'Progress by module',
    ofLessons: (done: number, total: number) => `${done} of ${total}`,
    moduleLabel: (title: string, done: number, total: number) =>
      `${title}: ${done} of ${total} lessons`,
    complete: 'Complete',
    inProgress: 'In progress',
    notStarted: 'Not started',
    earned: (child: string) => `Badges ${child} has earned`,
    noBadges: (child: string) => `${child} hasn’t earned a badge yet.`,
    noLessons: (child: string) =>
      `${child} hasn’t started a lesson yet. Their progress and badges show here once they do.`,
    private: (child: string) =>
      `Lessons, quiz answers, reflections and mentor notes stay between ${child} and their mentor.`,
    announcementsIntro: (org: string) => `Updates for your family from ${org}.`,
    markAllRead: 'Mark all read',
    newBadge: 'New',
    allRead: 'All caught up. New announcements show here.',
    markFailed: 'That didn’t go through',
    markFailedText: 'Nothing changed. Try again.',
    noAnnouncements: 'No announcements yet',
    noAnnouncementsText: (org: string) => `Updates from ${org} will show here.`,
    loadingAnnouncements: 'Loading announcements',
    from: (who: string, date: string) => `${who} · ${date}`,
  },
  es: {
    children: 'Sus hijos',
    childrenFooter: 'Ver horario, consentimientos y progreso',
    noPrograms: 'Todavía no está en un programa',
    announcements: 'Anuncios',
    newAnnouncements: (n: number, org: string) => `${n} nuevos de ${org}.`,
    noNewAnnouncements: 'No hay anuncios nuevos.',
    readAnnouncements: 'Leer los anuncios',
    learningBond: 'Bono de Estudios',
    openLearningBond: 'Abrir el Bono de Estudios',
    learningBondLine: (name: string, status: string) =>
      ({
        Invited: `${name} podría tener derecho a dinero para estudiar después de la secundaria.`,
        Started: `La solicitud de ${name} está empezada.`,
        Paused: `La solicitud de ${name} espera algo de usted.`,
        Submitted: `La solicitud de ${name} se envió.`,
        Deposited: `El Bono de ${name} se depositó.`,
        NotCompleted: `La solicitud de ${name} no se completó.`,
      })[status] ?? '',
    back: 'Volver a su familia',
    childIntro: (child: string, org: string) =>
      `Un resumen de solo lectura de cómo le va a ${child} en ${org}.`,
    loadingChild: 'Cargando la página',
    schedule: 'Horario',
    scheduleFooter: 'Las próximas cuatro semanas.',
    nothingScheduled: 'No hay nada programado en las próximas cuatro semanas.',
    today: 'Hoy',
    cancelled: 'Cancelada',
    consents: 'Consentimientos',
    nothingToSign: 'No hay nada que firmar por ahora.',
    participation: 'Participar en Learning y la mentoría',
    given: 'Dado',
    withdrawn: 'Retirado',
    needed: 'Pendiente',
    signedBy: (who: string, relationship: string | null, date: string, reference: string | null) =>
      [`Firmado por ${who}${relationship ? ` (${relationship})` : ''}`, date, reference]
        .filter(Boolean)
        .join(' · '),
    withdrawnBy: (who: string, date: string) => `Retirado por ${who} · ${date}`,
    neededText: 'Le enviaremos un enlace para dar su consentimiento.',
    signed: 'Firmado',
    declined: 'Rechazado',
    notSigned: 'Sin firmar',
    slipSigned: (who: string, date: string) => `Firmado por ${who} · ${date}`,
    slipDeclined: (who: string, date: string) => `Rechazado por ${who} · ${date}`,
    signBy: (date: string) => `Firme antes del ${date} con el enlace que le enviamos.`,
    attendance: 'Asistencia',
    attendanceCaption: (attended: number, marked: number) => `${attended} de ${marked} sesiones`,
    noSessions: 'Todavía no hay sesiones registradas.',
    marks: { Present: 'Presente', Late: 'Tarde', Excused: 'Justificada', Absent: 'Ausente' },
    overall: 'Progreso general',
    overallCaption: (done: number, total: number) => `${done} de ${total} lecciones`,
    badges: 'Insignias',
    badgesCaption: (total: number) => `de ${total} insignias`,
    modules: 'Progreso por módulo',
    ofLessons: (done: number, total: number) => `${done} de ${total}`,
    moduleLabel: (title: string, done: number, total: number) =>
      `${title}: ${done} de ${total} lecciones`,
    complete: 'Completo',
    inProgress: 'En curso',
    notStarted: 'Sin empezar',
    earned: (child: string) => `Insignias que ${child} ha ganado`,
    noBadges: (child: string) => `${child} todavía no ha ganado una insignia.`,
    noLessons: (child: string) =>
      `${child} todavía no ha empezado una lección. Su progreso y sus insignias aparecerán aquí.`,
    private: (child: string) =>
      `Las lecciones, las respuestas, las reflexiones y las notas del mentor quedan entre ${child} y su mentor.`,
    announcementsIntro: (org: string) => `Novedades para su familia de ${org}.`,
    markAllRead: 'Marcar todos como leídos',
    newBadge: 'Nuevo',
    allRead: 'Está al día. Los anuncios nuevos aparecerán aquí.',
    markFailed: 'No se pudo hacer',
    markFailedText: 'No cambió nada. Inténtelo de nuevo.',
    noAnnouncements: 'Todavía no hay anuncios',
    noAnnouncementsText: (org: string) => `Las novedades de ${org} aparecerán aquí.`,
    loadingAnnouncements: 'Cargando los anuncios',
    from: (who: string, date: string) => `${who} · ${date}`,
  },
  fr: {
    children: 'Vos enfants',
    childrenFooter: 'Voir l’horaire, les consentements et les progrès',
    noPrograms: 'Pas encore inscrit à un programme',
    announcements: 'Annonces',
    newAnnouncements: (n: number, org: string) => `${n} nouvelles de ${org}.`,
    noNewAnnouncements: 'Aucune nouvelle annonce.',
    readAnnouncements: 'Lire les annonces',
    learningBond: 'Bon d’études',
    openLearningBond: 'Ouvrir le Bon d’études',
    learningBondLine: (name: string, status: string) =>
      ({
        Invited: `${name} pourrait avoir droit à de l’argent pour les études après le secondaire.`,
        Started: `La demande de ${name} est commencée.`,
        Paused: `La demande de ${name} attend quelque chose de vous.`,
        Submitted: `La demande de ${name} a été envoyée.`,
        Deposited: `Le Bon de ${name} a été déposé.`,
        NotCompleted: `La demande de ${name} n’a pas été complétée.`,
      })[status] ?? '',
    back: 'Retour à votre famille',
    childIntro: (child: string, org: string) =>
      `Un aperçu en lecture seule de la façon dont ${child} progresse à ${org}.`,
    loadingChild: 'Chargement de la page',
    schedule: 'Horaire',
    scheduleFooter: 'Les quatre prochaines semaines.',
    nothingScheduled: 'Rien de prévu dans les quatre prochaines semaines.',
    today: 'Aujourd’hui',
    cancelled: 'Annulée',
    consents: 'Consentements',
    nothingToSign: 'Rien à signer pour le moment.',
    participation: 'Participer à Learning et au mentorat',
    given: 'Donné',
    withdrawn: 'Retiré',
    needed: 'À donner',
    signedBy: (who: string, relationship: string | null, date: string, reference: string | null) =>
      [`Signé par ${who}${relationship ? ` (${relationship})` : ''}`, date, reference]
        .filter(Boolean)
        .join(' · '),
    withdrawnBy: (who: string, date: string) => `Retiré par ${who} · ${date}`,
    neededText: 'Nous vous enverrons un lien pour donner votre consentement.',
    signed: 'Signé',
    declined: 'Refusé',
    notSigned: 'Pas encore signé',
    slipSigned: (who: string, date: string) => `Signé par ${who} · ${date}`,
    slipDeclined: (who: string, date: string) => `Refusé par ${who} · ${date}`,
    signBy: (date: string) => `Signez avant le ${date} avec le lien envoyé par texto.`,
    attendance: 'Présences',
    attendanceCaption: (attended: number, marked: number) => `${attended} sur ${marked} séances`,
    noSessions: 'Aucune séance notée pour l’instant.',
    marks: { Present: 'Présent', Late: 'En retard', Excused: 'Excusé', Absent: 'Absent' },
    overall: 'Progrès global',
    overallCaption: (done: number, total: number) => `${done} leçons sur ${total}`,
    badges: 'Badges',
    badgesCaption: (total: number) => `sur ${total} badges`,
    modules: 'Progrès par module',
    ofLessons: (done: number, total: number) => `${done} sur ${total}`,
    moduleLabel: (title: string, done: number, total: number) =>
      `${title} : ${done} leçons sur ${total}`,
    complete: 'Terminé',
    inProgress: 'En cours',
    notStarted: 'Pas commencé',
    earned: (child: string) => `Badges obtenus par ${child}`,
    noBadges: (child: string) => `${child} n’a pas encore obtenu de badge.`,
    noLessons: (child: string) =>
      `${child} n’a pas encore commencé de leçon. Ses progrès et ses badges s’afficheront ici.`,
    private: (child: string) =>
      `Les leçons, les réponses aux quiz, les réflexions et les notes du mentor restent entre ${child} et son mentor.`,
    announcementsIntro: (org: string) => `Les nouvelles de ${org} pour votre famille.`,
    markAllRead: 'Tout marquer comme lu',
    newBadge: 'Nouveau',
    allRead: 'Vous êtes à jour. Les nouvelles annonces s’afficheront ici.',
    markFailed: 'Ça n’a pas fonctionné',
    markFailedText: 'Rien n’a changé. Réessayez.',
    noAnnouncements: 'Aucune annonce pour l’instant',
    noAnnouncementsText: (org: string) => `Les nouvelles de ${org} s’afficheront ici.`,
    loadingAnnouncements: 'Chargement des annonces',
    from: (who: string, date: string) => `${who} · ${date}`,
  },
};

export type PortalText = (typeof TEXT)['en'];

export function portalText(language: GuardianLanguage): PortalText {
  return TEXT[language] as PortalText;
}

const LOCALE: Record<GuardianLanguage, string> = { en: 'en-GB', es: 'es', fr: 'fr-CA' };

/** "Thu 5 Nov", "jue 5 nov", "jeu. 5 nov." in the page's language; a yyyy-mm-dd date is read as that calendar day. */
export function shortDate(date: string, language: GuardianLanguage): string {
  const day = date.length === 10;
  return new Intl.DateTimeFormat(LOCALE[language], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: day ? 'UTC' : undefined,
  })
    .format(day ? new Date(`${date}T12:00:00Z`) : new Date(date))
    .replace(',', '');
}
