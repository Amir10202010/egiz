// EGIZ · step 3, Analysis. The visitor states the mission question (a priority profile) and runs EGIZ's engines
// on the site: the discovery index, ranking stress test, the candidate-space machine-learning model, the gap
// ledger, published-analog validation, ATLAS-Π and the independent critic. Steps execute in this browser one
// after another; each shows its method, its data, its own measured run time and its outputs. Findings are written
// from those outputs by fixed rules. A stored run can be re-executed to check it reproduces.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CircleAlert, CircleDashed, LoaderCircle, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { t } from '../../i18n';
import { usePlanet } from '../../planet/workspace/store';
import { analysisCurrent, insights, runStep, STEPS, toRecord, type AnalysisInput, type Insight, type RunState, type StepId, type StepResult } from '../../planet/journey/analysis';
import { AskPanel } from '../AskPanel';
import { StepFooter, StepHead } from '../ExpeditionPage';
import { fmtMs, short, utcShort } from '../format';

export const PROFILE_MEANING: Record<string, string> = {
  general: 'A balanced resemblance across terrain, surface, climate, light and geology.',
  rover_mobility: 'Driving: slopes, roughness and regional relief dominate.',
  eva_geology: 'Astronauts on foot doing field geology and sampling: exposed rock, geology, mineralogy.',
  power_illumination: 'Solar power and low-Sun operations: light, regional relief, temperature, dust.',
  astrobiology: 'Habitability research: dryness, mineralogy, geology, ice.',
};
const nowUtc = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function AnalysisStep() {
  const s = usePlanet(), b = s.bundle, x = s.inv.target ? s.target() : null, weights = s.weights(), shardReady = !!(s.shard && x && s.shard.target === x.id);
  const [results, setResults] = useState<StepResult[]>([]), [running, setRunning] = useState<StepId | null>(null), [found, setFound] = useState<Insight[] | null>(null), [repro, setRepro] = useState<string | null>(null);
  const token = useRef(0), stored = s.inv.analysis, current = analysisCurrent(stored, x?.id, weights);
  useEffect(() => { token.current++; setResults([]); setFound(null); setRunning(null); setRepro(null); }, [x?.id, s.inv.profile, JSON.stringify(s.inv.weights)]); // eslint-disable-line react-hooks/exhaustive-deps
  const input: AnalysisInput | null = useMemo(() => (b && x && s.shard && shardReady ? { bundle: b, target: x, shard: s.shard, weights, profile: s.inv.profile, validation: s.validation, atlas: s.atlas, space: s.space } : null), [b, x, s.shard, shardReady, JSON.stringify(weights), s.inv.profile, s.validation, s.atlas, s.space]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async () => {
    if (!input || running) return; const my = ++token.current, st: RunState = {}, out: StepResult[] = []; setResults([]); setFound(null); setRepro(null);
    for (const step of STEPS) {
      setRunning(step.id);
      // Yield so the visitor sees which computation is executing; the time shown is the computation's own.
      await new Promise(r => window.setTimeout(r, reduced() ? 0 : 220));
      if (my !== token.current) return;
      const r = runStep(step.id, input, st); out.push(r); setResults([...out]);
    }
    setRunning(null);
    if (st.space && !usePlanet.getState().space) usePlanet.getState().set({ space: st.space });
    const rec = toRecord(input, st, out, nowUtc()), prev = usePlanet.getState().inv.analysis;
    if (prev && prev.target === rec.target && prev.weightsKey === rec.weightsKey) setRepro(prev.top10.join() === rec.top10.join() ? `${t('Reproduced: the top-10 Earth windows are identical to the run of')} ${utcShort(prev.ranUtc)}.` : `${t('Different from the run of')} ${utcShort(prev.ranUtc)}: ${t('the index or inputs changed.')}`);
    usePlanet.getState().patchInv({ analysis: rec });
    usePlanet.getState().log('analysis', `Ran the site analysis for ${rec.target} under “${b!.profiles[input.profile]?.label ?? input.profile}”: verdict ${rec.verdict}; leading Earth window ${rec.top10[0] ?? 'none'}`, rec.target);
    setFound(insights(input, st, out));
  };
  if (!x || !b) return <div className="xp-msg" role="status">{s.discoveryError ?? t('Loading the measured site index…')}</div>;
  return <div className="xp-analysis">
    <aside className="xp-analysis-side">
      <StepHead step="analysis">{short(x.name)} · {x.dem}</StepHead>
      <h2 className="xp-h3">{t('What is the mission asking?')}</h2>
      <p className="xp-dim">{t('The question sets how much each kind of resemblance counts. It is a preference, not a measurement — and the analysis tests how much the answer depends on it.')}</p>
      <div className="xp-profiles" role="radiogroup" aria-label={t('Mission question')}>{Object.entries(b.profiles).map(([k, p]) => <button key={k} role="radio" aria-checked={s.inv.profile === k} className={s.inv.profile === k ? 'on' : ''} disabled={!!running}
        onClick={() => { if (s.inv.profile === k) return; s.patchInv({ profile: k, weights: null }); s.log('profile', `Set the mission question to “${p.label}”`); }}><b>{t(p.label)}</b><span>{t(PROFILE_MEANING[k] ?? '')}</span></button>)}</div>
      {s.inv.weights && <p className="xp-warn">{t('Custom weights are active.')} <button className="xp-link" onClick={() => s.patchInv({ weights: null })}>{t('Reset to the profile')}</button></p>}
      <button className="eg-button xp-run" onClick={run} disabled={!input || !!running}>{running ? <><LoaderCircle size={15} className="xp-spin" />{t('Running…')}</> : results.length || current ? <><RotateCcw size={15} />{t('Run again')}</> : <>{t('Run the analysis')}<ArrowRight size={16} strokeWidth={1.6} /></>}</button>
      {!shardReady && <p className="xp-dim" role="status">{t('Loading the per-window scores for')} {x.id}…</p>}
      {current && !results.length && stored && <p className="xp-stored"><ShieldCheck size={14} />{t('Analysed')} {utcShort(stored.ranUtc)} · {t('verdict')} <b>{stored.verdict}</b> · {t('leader')} {stored.top10[0]}. {t('Run again to verify it reproduces.')}</p>}
      {stored && !current && <p className="xp-warn">{t('The last analysis no longer matches the site or the question. Run again before relying on it.')}</p>}
      <p className="xp-dim xp-small">{t('Runs entirely in this browser on the packaged measured index. No language model or external service is used.')}</p>
    </aside>
    <div className="xp-analysis-main">
      <ol className="xp-steps" aria-label={t('Analysis steps')} aria-live="polite">
        {STEPS.map((step, i) => { const r = results.find(z => z.id === step.id), state = r ? (r.ok ? 'done' : 'failed') : running === step.id ? 'running' : 'queued';
          return <li key={step.id} className={`xp-astep s-${state}`}>
            <span className="xp-astep-icon" aria-hidden="true">{state === 'done' ? <Check size={14} /> : state === 'failed' ? <CircleAlert size={14} /> : state === 'running' ? <LoaderCircle size={14} className="xp-spin" /> : <CircleDashed size={14} />}</span>
            <div className="xp-astep-body">
              <h3><b>{String(i + 1).padStart(2, '0')}</b>{t(step.title)}{r && <span className="xp-ms">{fmtMs(r.ms)}</span>}</h3>
              <p className="xp-method">{t(step.method)}<span> · {step.data(input ?? ({ bundle: b, target: x, weights, profile: s.inv.profile, validation: s.validation, atlas: s.atlas, space: s.space } as AnalysisInput))}</span></p>
              {r && <><p className="xp-sum">{r.summary}</p>
                {r.facts.length > 0 && <dl className="xp-facts">{r.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}<em className={`xp-ev ev-${f.evidence}`}>{f.evidence}</em></dd></div>)}</dl>}
                {r.detail && r.detail.length > 0 && <details><summary>{t('Details')}</summary><ul>{r.detail.map(d => <li key={d}>{d}</li>)}</ul></details>}</>}
            </div>
          </li>; })}
      </ol>
      {!results.length && !running && <p className="xp-dim">{t('Eight computations run in order. Each reports what it used and how long it took.')}</p>}
      {repro && <p className="xp-repro" role="status"><ShieldCheck size={15} />{repro}</p>}
      {found && <section className="xp-found" aria-label={t('Findings')}>
        <h2 className="xp-h3">{t('What the analysis found')}</h2>
        <ul className="xp-insights">{found.map(z => <li key={z.title} className={`t-${z.tone === 'lead' || z.tone === 'good' ? 'info' : z.tone}`}>{z.tone === 'risk' ? <TriangleAlert size={15} /> : z.tone === 'caution' ? <CircleAlert size={15} /> : <Check size={15} />}<div><b>{z.title}</b><p>{z.text}</p></div></li>)}</ul>
      </section>}
      {!found && stored && current && stored.findings.length > 0 && <section className="xp-found"><h2 className="xp-h3">{t('Findings of the stored run')}</h2>
        <ul className="xp-insights">{stored.findings.map(f => <li key={f.title} className={`t-${f.severity === 'reject' ? 'risk' : f.severity === 'caution' ? 'caution' : 'info'}`}><div><b>{f.title}</b><p>{f.detail}</p></div></li>)}</ul></section>}
      {(found || current) && <AskPanel />}
      <StepFooter step="analysis" ready={!!current || !!found} why="One site is never the whole story. See how the other measured sites on this world compare before committing." />
    </div>
  </div>;
}
