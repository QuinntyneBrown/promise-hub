import type { GuardianLanguage } from './guardian-text';

const TEXT = {
  en: {
    heading: (name: string) => `Two quick questions, ${name}`,
    about: (event: string, by: string) => `About ${event}. Answers go to ${by}.`,
    rate: (child: string) => `How was it for ${child}?`,
    low: 'Not good',
    high: 'Great',
    comment: 'Anything we should know?',
    placeholder: 'What went well, what to change',
    send: 'Send',
    thanks: 'Thank you',
    thanksText: 'Your answer went to the team.',
    closedHeading: 'This survey has closed',
    closedText: (org: string) =>
      `Surveys close a week after they are sent. Call or text ${org} if you have more to say.`,
    failed: 'We couldn’t send that. Tap Send again.',
  },
  es: {
    heading: (name: string) => `Dos preguntas rápidas, ${name}`,
    about: (event: string, by: string) => `Sobre ${event}. Las respuestas van a ${by}.`,
    rate: (child: string) => `¿Cómo le fue a ${child}?`,
    low: 'Mal',
    high: 'Muy bien',
    comment: '¿Algo que debamos saber?',
    placeholder: 'Qué salió bien, qué cambiar',
    send: 'Enviar',
    thanks: 'Gracias',
    thanksText: 'Su respuesta llegó al equipo.',
    closedHeading: 'Esta encuesta está cerrada',
    closedText: (org: string) =>
      `Las encuestas cierran una semana después de enviarse. Llame o escriba a ${org} si quiere decir algo más.`,
    failed: 'No pudimos enviarlo. Toque Enviar otra vez.',
  },
  fr: {
    heading: (name: string) => `Deux petites questions, ${name}`,
    about: (event: string, by: string) => `À propos de ${event}. Les réponses vont à ${by}.`,
    rate: (child: string) => `Comment ça s’est passé pour ${child} ?`,
    low: 'Pas bien',
    high: 'Très bien',
    comment: 'Quelque chose à nous dire ?',
    placeholder: 'Ce qui a bien marché, ce qu’il faut changer',
    send: 'Envoyer',
    thanks: 'Merci',
    thanksText: 'Votre réponse est arrivée à l’équipe.',
    closedHeading: 'Ce sondage est fermé',
    closedText: (org: string) =>
      `Les sondages ferment une semaine après l’envoi. Appelez ou écrivez à ${org} pour en dire plus.`,
    failed: 'Nous n’avons pas pu l’envoyer. Touchez Envoyer de nouveau.',
  },
};

/** The survey page's words in the household's language (L2-027). */
export function surveyText(language: GuardianLanguage) {
  return TEXT[language] ?? TEXT.en;
}
