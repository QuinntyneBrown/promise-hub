import type { PublicModule } from './public-module';

/** A published track with its published modules in order (Learning only). */
export interface PublicTrack {
  name: string;
  description: string | null;
  modules: PublicModule[];
}
