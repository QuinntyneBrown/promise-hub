// Scaffold only. Overwrite or delete as implementation requires. No product logic is implemented.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const workspace = new URL('../frontend/', import.meta.url);
const cli = fileURLToPath(new URL('../frontend/node_modules/@angular/cli/bin/ng.js', import.meta.url));
const { projects } = JSON.parse(readFileSync(new URL('angular.json', workspace), 'utf8'));
for (const name of Object.keys(projects)) {
  const result = spawnSync(process.execPath, [cli, 'build', name], { cwd: workspace, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
