import { describe, expect, it } from 'vitest';
import { applyPatch, createIncident, injectWeird, replayCausality, runScenario, submitDiagnosis } from '../domain/incident';

describe('Patch Poltergeist incident model', () => {
  it('starts with a plausible but wrong resizer diagnosis', () => {
    const state = createIncident('morning-ryo');
    expect(state.belief.hypothesis).toBe('resizer-memory');
    expect(state.services.find((s) => s.id === 'auth')?.hiddenDebt).toBeGreaterThan(80);
    expect(state.logs.some((log) => log.text.includes('auth deploy'))).toBe(true);
  });

  it('makes tempting patches visibly help while adding side effects', () => {
    const before = createIncident('morning-ryo');
    const after = applyPatch(before, 'restart-resizer');
    expect(after.services.find((s) => s.id === 'resizer')?.symptom).toBeLessThan(before.services.find((s) => s.id === 'resizer')!.symptom);
    expect(after.services.find((s) => s.id === 'auth')?.sideEffects.length).toBeGreaterThan(0);
  });

  it('rewards compound diagnosis and causal patch sequence', () => {
    const result = runScenario('morning-ryo', ['dedupe-ghost-tokens', 'drain-poison-queue', 'rollback-auth-cache'], 'auth-ghost-token-compound');
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.stable).toBe(true);
  });

  it('quarantines weird input as inert text', () => {
    const state = injectWeird(createIncident('x'), '<script>alert(1)</script>');
    expect(state.logs[0].text).toContain('scriptalert');
    expect(state.logs[0].text).not.toContain('<script>');
  });

  it('lets replay lower false confidence before diagnosis', () => {
    const replayed = replayCausality(createIncident('x'));
    const diagnosed = submitDiagnosis(replayed, 'auth-ghost-token-compound');
    expect(replayed.belief.confidence).toBeLessThan(93);
    expect(diagnosed.belief.contradictedBy).toHaveLength(0);
  });
});
