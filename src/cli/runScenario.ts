import { runScenario } from '../domain/incident';
import type { DiagnosisId, PatchId } from '../domain/types';

const args = process.argv.slice(2);
function value(name: string, fallback = ''): string {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}
function values(name: string): string[] {
  return args.flatMap((arg, i) => (arg === `--${name}` && args[i + 1] ? [args[i + 1]] : []));
}

const seed = value('seed', 'morning-ryo');
const patches = values('patch') as PatchId[];
const diagnosis = (value('diagnosis', 'auth-ghost-token-compound') || 'auth-ghost-token-compound') as DiagnosisId;
const result = runScenario(seed, patches.length ? patches : ['restart-resizer', 'dedupe-ghost-tokens', 'drain-poison-queue', 'rollback-auth-cache'], diagnosis);

if (args.includes('--json')) {
  console.log(JSON.stringify({ seed, patches: result.state.appliedPatches, diagnosis, stability: result.state.stability, score: result.score, stable: result.stable, verdict: result.verdict, topLogs: result.state.logs.slice(0, 6).map((log) => log.text) }, null, 2));
} else {
  console.log(`Patch Poltergeist / seed=${seed}`);
  console.log(`patches=${result.state.appliedPatches.join(', ')}`);
  console.log(`diagnosis=${diagnosis}`);
  console.log(`stability=${result.state.stability} score=${result.score} stable=${result.stable}`);
  console.log(result.verdict);
  for (const log of result.state.logs.slice(0, 8)) console.log(`- [${log.kind}] ${log.text}`);
}
