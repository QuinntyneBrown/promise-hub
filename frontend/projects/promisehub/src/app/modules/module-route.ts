import { Route } from '@angular/router';
import { ModuleId } from '@promisehub/api';
import { moduleOffRedirect, moduleOn } from './module.guards';

/** A feature route of a module, or of several: lazy-loaded while every one is on, redirected to Today while any is off. */
export function moduleRoute(
  path: string,
  module: ModuleId | ModuleId[],
  loadChildren: Route['loadChildren'],
): Route[] {
  return [
    { path, canMatch: [moduleOn(module)], loadChildren },
    { path, canMatch: [moduleOffRedirect(module)], children: [] },
  ];
}
