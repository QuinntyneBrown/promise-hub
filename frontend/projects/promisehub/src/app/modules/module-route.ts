import { Route } from '@angular/router';
import { ModuleId } from '@promisehub/api';
import { moduleOffRedirect, moduleOn } from './module.guards';

/** A feature route of a module: lazy-loaded while the module is on, redirected to Today while it is off. */
export function moduleRoute(
  path: string,
  module: ModuleId,
  loadChildren: Route['loadChildren'],
): Route[] {
  return [
    { path, canMatch: [moduleOn(module)], loadChildren },
    { path, canMatch: [moduleOffRedirect(module)], children: [] },
  ];
}
