import type { GuardianLanguage } from './guardian-text';

const TEXT = {
  en: {
    heading: 'Your data',
    intro: 'Get a copy of your family’s data, or ask us to delete it.',
    open: 'Ask about your data',
    title: 'Ask about your family’s data',
    description: 'We answer within 30 days.',
    legend: 'Request',
    copy: 'A copy of our data',
    delete: 'Delete our data',
    email: 'Send it to',
    send: 'Send request',
    cancel: 'Cancel',
    failed: 'We couldn’t send that. Try again.',
    sent: 'Request received. We’ll email you within 30 days.',
  },
  es: {
    heading: 'Sus datos',
    intro: 'Pida una copia de los datos de su familia, o que los borremos.',
    open: 'Preguntar por sus datos',
    title: 'Preguntar por los datos de su familia',
    description: 'Respondemos en 30 días.',
    legend: 'Solicitud',
    copy: 'Una copia de nuestros datos',
    delete: 'Borrar nuestros datos',
    email: 'Enviarla a',
    send: 'Enviar solicitud',
    cancel: 'Cancelar',
    failed: 'No pudimos enviarla. Inténtelo otra vez.',
    sent: 'Solicitud recibida. Le escribiremos en 30 días.',
  },
  fr: {
    heading: 'Vos données',
    intro: 'Demandez une copie des données de votre famille, ou leur suppression.',
    open: 'Demander vos données',
    title: 'Demander les données de votre famille',
    description: 'Nous répondons sous 30 jours.',
    legend: 'Demande',
    copy: 'Une copie de nos données',
    delete: 'Supprimer nos données',
    email: 'L’envoyer à',
    send: 'Envoyer la demande',
    cancel: 'Annuler',
    failed: 'Nous n’avons pas pu l’envoyer. Réessayez.',
    sent: 'Demande reçue. Nous vous écrirons sous 30 jours.',
  },
};

export type DataRequestText = (typeof TEXT)['en'];

/** The data request's words in the household's language (L2-027). */
export function dataRequestText(language: GuardianLanguage): DataRequestText {
  return TEXT[language] ?? TEXT.en;
}
