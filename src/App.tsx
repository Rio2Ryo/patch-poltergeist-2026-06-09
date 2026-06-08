import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import { applyPatch, createIncident, diagnosisLabels, injectWeird, patchLabels, replayCausality, submitDiagnosis } from './domain/incident';
import type { DiagnosisId, IncidentState, PatchId, ServiceId } from './domain/types';

declare global { interface Window { __PATCH_POLTERGEIST__?: ReturnType<typeof makeDebugApi>; } }

function getSeed() {
  return new URLSearchParams(location.search).get('seed') || 'morning-ryo';
}

function makeDebugApi(get: () => IncidentState, set: (state: IncidentState) => void) {
  return {
    getState: get,
    replay: () => set(replayCausality(get())),
    patch: (patch: PatchId) => set(applyPatch(get(), patch)),
    diagnose: (diagnosis: DiagnosisId) => set(submitDiagnosis(get(), diagnosis)),
    injectWeird: (input: string) => set(injectWeird(get(), input)),
    exportIncident: () => JSON.stringify(get(), null, 2),
  };
}

export default function App() {
  const [state, setState] = useState(() => createIncident(getSeed()));
  const [selected, setSelected] = useState<ServiceId>('auth');
  const [weird, setWeird] = useState('<script>alert("ghost")</script>');
  const selectedService = state.services.find((service) => service.id === selected) ?? state.services[0];
  const debugApi = useMemo(() => makeDebugApi(() => state, setState), [state]);

  useEffect(() => { window.__PATCH_POLTERGEIST__ = debugApi; }, [debugApi]);

  const firstLog = state.logs[0]?.text ?? 'no logs yet';
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Patch Poltergeist / compound incident lab</p>
          <h1>緑のダッシュボードが嘘をつく、幽霊障害の診断室</h1>
          <p className="lead">最初の診断はもっともらしく間違う。パッチは効くが、副作用を残す。リプレイで因果の赤い糸をほどく。</p>
        </div>
        <div className="soul" aria-label="PROD SOUL tube"><span>{state.stability}</span><small>PROD SOUL</small></div>
      </section>

      <section className="gridArea">
        <div className="serviceMap" aria-label="haunted service map">
          {state.services.map((service) => (
            <button key={service.id} className={`node ${service.id === selected ? 'selected' : ''}`} onClick={() => setSelected(service.id)} style={{ '--health': service.health, '--symptom': service.symptom } as React.CSSProperties}>
              <strong>{service.label}</strong>
              <span>{service.mood}</span>
              <i>health {service.health} / symptom {service.symptom}</i>
              {service.ghostTokens > 0 && <b className="ghost">ghost {service.ghostTokens}</b>}
              {service.poisonJobs > 0 && <b className="poison">poison {service.poisonJobs}</b>}
            </button>
          ))}
        </div>

        <aside className="panel inspector">
          <p className="eyebrow">Inspect: {selectedService.label}</p>
          <dl>
            <dt>visible symptom</dt><dd>{selectedService.symptom}</dd>
            <dt>operator confidence</dt><dd>{selectedService.confidence}%</dd>
            <dt>hidden debt</dt><dd>{selectedService.hiddenDebt}</dd>
            <dt>side effects</dt><dd>{selectedService.sideEffects.length ? selectedService.sideEffects.join(' / ') : 'none yet'}</dd>
          </dl>
        </aside>
      </section>

      <section className="controls">
        <div className="panel">
          <p className="eyebrow">Operate</p>
          <button onClick={() => setState(replayCausality(state))}>Replay causality</button>
          {(Object.keys(patchLabels) as PatchId[]).map((patch) => <button key={patch} onClick={() => setState(applyPatch(state, patch))}>{patchLabels[patch]}</button>)}
        </div>
        <div className="panel">
          <p className="eyebrow">Belief state</p>
          <h2>{diagnosisLabels[state.belief.hypothesis]}</h2>
          <p>confidence {state.belief.confidence}%</p>
          <p className="contradiction">contradicted by: {state.belief.contradictedBy.join(', ') || 'none'}</p>
          {(Object.keys(diagnosisLabels) as DiagnosisId[]).map((diagnosis) => <button key={diagnosis} onClick={() => setState(submitDiagnosis(state, diagnosis))}>{diagnosisLabels[diagnosis]}</button>)}
        </div>
        <div className="panel">
          <p className="eyebrow">Weird input quarantine</p>
          <input value={weird} onChange={(event) => setWeird(event.target.value)} aria-label="weird input" />
          <button onClick={() => setState(injectWeird(state, weird))}>Inject weird omen</button>
          <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(state)).catch(() => setState(injectWeird(state, 'clipboard unavailable')))}>Copy incident JSON</button>
        </div>
      </section>

      <section className="log panel">
        <p className="eyebrow">Evidence log</p>
        <h2>{firstLog}</h2>
        <ol>{state.logs.map((entry) => <li key={`${entry.tick}-${entry.text}`} className={entry.kind}><span>{entry.kind}</span>{entry.text}</li>)}</ol>
      </section>
    </main>
  );
}
