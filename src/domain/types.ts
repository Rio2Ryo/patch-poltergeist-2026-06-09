export type ServiceId = 'auth' | 'queue' | 'billing' | 'resizer' | 'notifier' | 'ledger';
export type PatchId = 'restart-resizer' | 'dedupe-ghost-tokens' | 'drain-poison-queue' | 'tighten-billing-retry' | 'wake-notification-bat' | 'rollback-auth-cache';
export type DiagnosisId = 'resizer-memory' | 'queue-latency' | 'billing-retry-storm' | 'auth-ghost-token-compound';

export type ServiceNode = {
  id: ServiceId;
  label: string;
  health: number;
  symptom: number;
  hiddenDebt: number;
  confidence: number;
  ghostTokens: number;
  poisonJobs: number;
  sideEffects: string[];
  mood: string;
};

export type EventLog = { tick: number; kind: 'clue' | 'misdiagnosis' | 'patch' | 'side-effect' | 'replay' | 'weird' | 'diagnosis'; text: string };
export type IncidentState = {
  seed: string;
  tick: number;
  services: ServiceNode[];
  logs: EventLog[];
  belief: { hypothesis: DiagnosisId; confidence: number; contradictedBy: string[] };
  appliedPatches: PatchId[];
  selectedDiagnosis?: DiagnosisId;
  stability: number;
  boredomAntidote: string;
};
export type ScenarioResult = { score: number; stable: boolean; state: IncidentState; verdict: string };
