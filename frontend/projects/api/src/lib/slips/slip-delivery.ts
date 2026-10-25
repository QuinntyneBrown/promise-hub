/** How the latest send went; households named by the SMS cap's email fallback, pauses and failures. */
export interface SlipDelivery {
  sent: number;
  emailInstead: string[];
  paused: string[];
  failed: string[];
}
