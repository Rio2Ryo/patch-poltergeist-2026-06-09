import type { DiagnosisId, EventLog, IncidentState, PatchId, ServiceId, ServiceNode } from './types';

const serviceLabels: Record<ServiceId, string> = {
  auth: 'Auth Ghost Gate',
  queue: 'Poison Queue',
  billing: 'Invoice Egg Incubator',
  resizer: 'Image Resizer Furnace',
  notifier: 'Notification Bat',
  ledger: 'Ledger Moss',
};

function hashSeed(seed: string): number {
  return [...seed].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function jitter(seed: string, index: number, max: number): number {
  const n = Math.sin(hashSeed(seed) + index * 999) * 10000;
  return Math.floor((n - Math.floor(n)) * max);
}

function makeService(id: ServiceId, seed: string, index: number): ServiceNode {
  const symptom = id === 'resizer' ? 88 : id === 'queue' ? 72 : id === 'billing' ? 69 : 25 + jitter(seed, index, 28);
  const hiddenDebt = id === 'auth' ? 91 : id === 'queue' ? 66 : id === 'billing' ? 55 : 12 + jitter(seed, index + 9, 22);
  return {
    id,
    label: serviceLabels[id],
    health: Math.max(8, 100 - Math.round((symptom + hiddenDebt) / 2)),
    symptom,
    hiddenDebt,
    confidence: id === 'resizer' ? 93 : id === 'auth' ? 38 : 58 + jitter(seed, index + 2, 25),
    ghostTokens: id === 'auth' ? 1300 + jitter(seed, 3, 400) : 0,
    poisonJobs: id === 'queue' ? 420 + jitter(seed, 4, 250) : id === 'billing' ? 160 : 0,
    sideEffects: [],
    mood: id === 'notifier' ? 'asleep upside-down' : id === 'auth' ? 'too quiet' : 'twitching',
  };
}

function baseLogs(): EventLog[] {
  return [
    { tick: 0, kind: 'clue', text: 'PROD SOUL tube flickered green while queue pressure climbed.' },
    { tick: 0, kind: 'misdiagnosis', text: 'Auto-diagnosis: image-resizer memory pressure, confidence 93%.' },
    { tick: 0, kind: 'clue', text: 'Contradiction: auth deploy happened 3 minutes before ghost jobs appeared.' },
  ];
}

export function createIncident(seed = 'morning-ryo'): IncidentState {
  const ids: ServiceId[] = ['auth', 'queue', 'billing', 'resizer', 'notifier', 'ledger'];
  const services = ids.map((id, i) => makeService(id, seed, i));
  return {
    seed,
    tick: 0,
    services,
    logs: baseLogs(),
    belief: { hypothesis: 'resizer-memory', confidence: 93, contradictedBy: ['auth deploy timeline', 'queue poison pattern'] },
    appliedPatches: [],
    stability: calculateStability(services),
    boredomAntidote: 'Green dashboards can lie; replay exposes causal strings and patch side effects.',
  };
}

export function calculateStability(services: ServiceNode[]): number {
  const debt = services.reduce((sum, s) => sum + s.hiddenDebt + s.symptom * 0.65 + s.sideEffects.length * 8, 0);
  return Math.max(0, Math.min(100, Math.round(100 - debt / services.length)));
}

function mutate(state: IncidentState, id: ServiceId, fn: (service: ServiceNode) => ServiceNode): IncidentState {
  const services = state.services.map((service) => (service.id === id ? fn({ ...service, sideEffects: [...service.sideEffects] }) : service));
  return { ...state, services, stability: calculateStability(services) };
}

function log(state: IncidentState, kind: EventLog['kind'], text: string): IncidentState {
  return { ...state, tick: state.tick + 1, logs: [{ tick: state.tick + 1, kind, text }, ...state.logs].slice(0, 40) };
}

export function applyPatch(state: IncidentState, patch: PatchId): IncidentState {
  let next = { ...state, appliedPatches: [...state.appliedPatches, patch] };
  if (patch === 'restart-resizer') {
    next = mutate(next, 'resizer', (s) => ({ ...s, symptom: Math.max(15, s.symptom - 54), confidence: 97, mood: 'looks cured but smug' }));
    next = mutate(next, 'auth', (s) => ({ ...s, hiddenDebt: s.hiddenDebt + 12, sideEffects: [...s.sideEffects, 'restart hid auth ghost tokens for one tick'] }));
    return log(next, 'side-effect', 'Restarted resizer: visible furnace calmed, but ghost tokens kept leaking under the floorboards.');
  }
  if (patch === 'dedupe-ghost-tokens') {
    next = mutate(next, 'auth', (s) => ({ ...s, ghostTokens: 90, hiddenDebt: Math.max(8, s.hiddenDebt - 62), symptom: Math.max(10, s.symptom - 20), mood: 'exorcised but brittle' }));
    next = mutate(next, 'notifier', (s) => ({ ...s, symptom: s.symptom + 24, hiddenDebt: s.hiddenDebt + 18, sideEffects: [...s.sideEffects, 'legacy mobile refresh flow angry'] }));
    return log(next, 'side-effect', 'Dedupe patch removed ghost fish; legacy phones started tapping angrily against Notification Bat glass.');
  }
  if (patch === 'drain-poison-queue') {
    next = mutate(next, 'queue', (s) => ({ ...s, poisonJobs: 40, hiddenDebt: Math.max(5, s.hiddenDebt - 43), symptom: Math.max(8, s.symptom - 38), mood: 'breathing again' }));
    next = mutate(next, 'billing', (s) => ({ ...s, symptom: s.symptom + 9, sideEffects: [...s.sideEffects, 'cracked invoice eggs delayed'] }));
    return log(next, 'patch', 'Drained poison queue; billing eggs cracked late instead of exploding.');
  }
  if (patch === 'tighten-billing-retry') {
    next = mutate(next, 'billing', (s) => ({ ...s, poisonJobs: Math.max(0, s.poisonJobs - 110), symptom: Math.max(10, s.symptom - 34), hiddenDebt: Math.max(8, s.hiddenDebt - 25) }));
    next = mutate(next, 'ledger', (s) => ({ ...s, hiddenDebt: s.hiddenDebt + 20, sideEffects: [...s.sideEffects, 'ledger moss growing stale receipts'] }));
    return log(next, 'side-effect', 'Retry window tightened; ledger moss began preserving stale receipts.');
  }
  if (patch === 'wake-notification-bat') {
    next = mutate(next, 'notifier', (s) => ({ ...s, symptom: Math.max(7, s.symptom - 31), hiddenDebt: Math.max(4, s.hiddenDebt - 15), mood: 'awake and judging' }));
    return log(next, 'patch', 'Notification Bat woke up and screamed at 17 stuck retries.');
  }
  next = mutate(next, 'auth', (s) => ({ ...s, ghostTokens: 0, hiddenDebt: Math.max(3, s.hiddenDebt - 80), symptom: 12, confidence: 74, mood: 'rolled back to humble cache' }));
  next = mutate(next, 'queue', (s) => ({ ...s, hiddenDebt: Math.max(4, s.hiddenDebt - 34), symptom: Math.max(6, s.symptom - 24) }));
  next = mutate(next, 'billing', (s) => ({ ...s, hiddenDebt: Math.max(6, s.hiddenDebt - 18), symptom: Math.max(8, s.symptom - 18) }));
  return log(next, 'patch', 'Rolled back auth-cache-v3; causal red string snapped into place and downstream retries cooled.');
}

export function submitDiagnosis(state: IncidentState, diagnosis: DiagnosisId): IncidentState {
  const correct = diagnosis === 'auth-ghost-token-compound';
  const next = { ...state, selectedDiagnosis: diagnosis, belief: { hypothesis: diagnosis, confidence: correct ? 86 : 47, contradictedBy: correct ? [] : ['replay timeline', 'ghost token count'] } };
  return log(next, 'diagnosis', correct ? 'Diagnosis accepted: auth ghost tokens → queue poison → billing retries → false resizer symptom.' : `Diagnosis challenged: ${diagnosis} explains symptoms, not the root chain.`);
}

export function replayCausality(state: IncidentState): IncidentState {
  return log({ ...state, belief: { ...state.belief, confidence: Math.max(20, state.belief.confidence - 21) } }, 'replay', 'Replay drew red strings: auth-cache-v3 → duplicate ghost sessions → poison queue → billing retry storm → fake resizer heat.');
}

export function injectWeird(state: IncidentState, input: string): IncidentState {
  const safe = input.replace(/[<>]/g, '').slice(0, 60) || 'empty anomaly';
  return log(state, 'weird', `Weird input quarantined as inert omen: "${safe}". No script executed, no state authority granted.`);
}

export function runScenario(seed: string, patches: PatchId[], diagnosis: DiagnosisId): { state: IncidentState; score: number; stable: boolean; verdict: string } {
  let state = createIncident(seed);
  state = replayCausality(state);
  for (const patch of patches) state = applyPatch(state, patch);
  state = submitDiagnosis(state, diagnosis);
  const correct = diagnosis === 'auth-ghost-token-compound';
  const harmfulPatchCount = patches.filter((patch) => patch === 'restart-resizer').length;
  const score = Math.max(0, Math.min(100, state.stability + (correct ? 28 : -18) - harmfulPatchCount * 14));
  return { state, score, stable: score >= 70, verdict: score >= 70 ? 'Ryo-facing: compound cause solved with visible side effects.' : 'Still too shallow or overpatched; replay again.' };
}

export const patchLabels: Record<PatchId, string> = {
  'restart-resizer': 'Restart Resizer (tempting wrong fix)',
  'dedupe-ghost-tokens': 'Dedupe Ghost Tokens',
  'drain-poison-queue': 'Drain Poison Queue',
  'tighten-billing-retry': 'Tighten Billing Retry',
  'wake-notification-bat': 'Wake Notification Bat',
  'rollback-auth-cache': 'Rollback Auth Cache v3',
};

export const diagnosisLabels: Record<DiagnosisId, string> = {
  'resizer-memory': 'Image-resizer memory pressure',
  'queue-latency': 'Queue latency only',
  'billing-retry-storm': 'Billing retry storm only',
  'auth-ghost-token-compound': 'Auth ghost-token compound failure',
};
