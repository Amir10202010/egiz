// EGIZ · Mission Home (#/mission). The operational centre of one mission: where it is, what was found, which Earth
// places rehearse it, what the simulations say, what is out of date, what is still unknown and what to do next —
// with every EGIZ workspace one click away, opened in the mission's context. Every line is read from the mission's
// investigation record, the loaded index or the campaign dataset; nothing here is computed for display only.
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CircleAlert, Download, FolderOpen, Repeat, RotateCcw } from 'lucide-react';
import { t, useLanguage } from '../i18n';
import { useAppStore, type Route } from '../state/store';
import { dataModeInfo } from '../data/modes';
import { downloadText } from '../lib/download';
import { aggregate } from '../discover/engine';
import { BODY_LABEL } from '../planet/terrain/site';
import { usePlanetData } from '../planet/workspace/data';
import { buildReport, JOURNEY_STEPS, serializeInvestigation } from '../planet/workspace/investigation';
import { usePlanet, type World } from '../planet/workspace/store';
import { analysisCurrent } from '../planet/journey/analysis';
import { knownUnknown } from '../planet/journey/knowledge';
import { goStep, startMission } from './actions';
import { STEP_INFO, staleItems, stepState } from './journey';
import { contextNote, openWorkspace, syncCampaignTarget, WORKSPACES } from './nav';
import { WorldChoice } from './WorldChoice';
import { fmtLat, fmtLon, short, utcShort } from './format';
import './expedition.css';

interface Action { label: string; why: string; go(): void }
export default function MissionHome() {
  useLanguage();
  const dataMode = useAppStore(a => a.dataMode), data = useAppStore(a => a.data); usePlanetData(dataMode);
  const s = usePlanet(), world = s.world(), b = s.bundle, x = s.inv.target ? s.target() : null, weights = s.weights();
  useEffect(() => { if (world && x) usePlanet.getState().enterHome(); }, [world, x?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { syncCampaignTarget(); }, [data, world]); // a data-mode switch reloads the campaign dataset
  const agg = useMemo(() => (s.shard && x && s.shard.target === x.id ? aggregate(s.shard, weights) : null), [s.shard, x?.id, JSON.stringify(weights)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(s.inv.decision?.text ?? ''); useEffect(() => setDraft(s.inv.decision?.text ?? ''), [s.inv.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!world) return <main className="mh mh-empty"><WorldChoice /></main>;
  const a = s.inv.analysis, current = analysisCurrent(a, x?.id, weights), stale = staleItems(s), ref = x ? s.refs.find(r => r.id === x.id) : undefined;
  const kept = s.inv.candidates, missing = b && x ? knownUnknown(b, x).filter(d => d.status !== 'measured' && d.status !== 'not_applicable') : [];
  const done = JOURNEY_STEPS.filter(id => stepState(id, s) === 'done').length;
  const appTarget = data?.targets.targets.find(z => z.body === world), template = appTarget ? data?.templates.templates.find(tp => appTarget.templates.includes(tp.id)) : undefined;
  const run = appTarget ? data?.results.runs.find(r => r.target === appTarget.id) : undefined, campaign = run?.campaigns.reduce((p, q) => (q.k > p.k ? q : p), run.campaigns[0]);
  const siteName = (id: string) => data?.candidates.tiles.find(tl => tl.id === id)?.name ?? id;
  const other: World = world === 'moon' ? 'mars' : 'moon';

  // What to do next: derived from what the record does and does not yet contain.
  const actions: Action[] = [];
  if (!x) actions.push({ label: 'Choose a site', why: 'Explore the planet and pick a measured site to investigate.', go: () => goStep('explore') });
  else {
    if (!current) actions.push({ label: a ? 'Re-run the site analysis' : 'Run the site analysis', why: a ? 'The site or priorities changed since the last run.' : 'Put EGIZ’s engines to work on the site.', go: () => goStep('analysis') });
    if (!kept.length || (s.inv.analogsFor && s.inv.analogsFor !== x.id)) actions.push({ label: 'Choose Earth analogs', why: 'Keep the Earth places that could rehearse this mission.', go: () => goStep('analogs') });
    if (stepState('alternatives', s) !== 'done') actions.push({ label: 'Compare alternative sites', why: 'See whether another measured site would serve the mission better.', go: () => goStep('alternatives') });
    if (ref && !s.inv.marks.length && !s.inv.measurements.length) actions.push({ label: 'Inspect the terrain in 3D', why: `Measured ${ref.postingM} m terrain is packaged for this site: mark landing zones, hazards and science targets.`, go: () => openWorkspace('planet') });
    if (!s.inv.experiments.length) actions.push({ label: 'Simulate a rover traverse', why: ref ? 'Drive the rover digital twin across the measured terrain and save the experiment.' : 'Rover simulation needs packaged terrain; the Engineering Lab runs traverse, launch, descent and EVA models.', go: () => openWorkspace(ref ? 'planet' : 'lab') });
    if (kept.length) actions.push({ label: 'Check what the analogs can rehearse', why: 'ATLAS-Π assesses each mission task for Earth sites, with certificates and a field-measurement plan.', go: () => openWorkspace('atlas') });
    actions.push({ label: 'Plan the field campaign', why: 'Choose objectives and the fewest Earth sites that cover them.', go: () => openWorkspace('campaign') });
    if (!s.inv.decision?.text) actions.push({ label: 'Record your conclusion', why: 'Write what you conclude and what must be measured next.', go: () => document.getElementById('mh-decide')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) });
  }
  const report = () => downloadText(buildReport(s.inv, { site: s.site, layers: s.layers, discovery: b && x && s.shard?.target === x.id ? { bundle: b, target: x, shard: s.shard, weights, selected: kept.at(-1) ?? null, compare: kept.slice(-4), validation: s.validation } : null, atlasVersion: s.atlas?.version ?? null, generatedUtc: new Date().toISOString() }), `${s.inv.id}-report.md`);
  const groups: { id: 'mission' | 'workspace' | 'reference'; label: string }[] = [{ id: 'workspace', label: 'Workspaces' }, { id: 'reference', label: 'Background' }];

  return <main className="mh" aria-labelledby="mh-title">
    <header className="mh-head">
      <div>
        <p className="eg-eyebrow"><span className={`xp-body-dot b-${world}`} aria-hidden="true" />{t('Mission Home')} · {t(BODY_LABEL[world])}</p>
        <h1 id="mh-title" className="eg-display">{x ? short(x.name) : t('No site yet')}</h1>
        {x && <p className="mh-coord">{fmtLat(x.lat)} · {fmtLon(x.lon)} · {x.dem}</p>}
        <label className="mh-title-edit"><span>{t('Mission')}</span><input value={s.inv.title} onChange={e => s.patchInv({ title: e.target.value })} aria-label={t('Mission name')} /></label>
      </div>
      <div className="mh-head-side">
        <ol className="mh-progress" aria-label={t('Guided investigation')}>{JOURNEY_STEPS.map(id => { const st = stepState(id, s); return <li key={id} className={`st-${st}`}><button onClick={() => goStep(id)} disabled={id !== 'explore' && !x}><i aria-hidden="true">{st === 'done' ? <Check size={11} strokeWidth={2.4} /> : st === 'stale' ? '!' : ''}</i>{t(STEP_INFO[id].label)}</button></li>; })}</ol>
        <p className="mh-dim">{done} {t('of')} {JOURNEY_STEPS.length} {t('guided steps complete')} · {t('saved in this browser')} {utcShort(s.inv.updatedUtc)}</p>
        <div className="mh-head-actions">
          <button className="eg-button quiet" onClick={() => goStep('explore', null)}><Repeat size={14} /><span>{t('Change site')}</span></button>
          <button className="eg-button quiet" onClick={() => startMission(other)}><span>{t(other === 'moon' ? 'Start a Moon mission' : 'Start a Mars mission')}</span></button>
        </div>
      </div>
    </header>

    {stale.length > 0 && <section className="mh-stale" aria-label={t('Needs recalculation')}>
      <h2 className="mh-h2"><CircleAlert size={16} />{t('Needs recalculation')}</h2>
      <ul>{stale.map(z => <li key={z.what}><div><b>{t(z.what)}</b><span>{z.why}</span></div><button className="eg-button quiet" onClick={() => (z.fix.step ? goStep(z.fix.step) : openWorkspace(z.fix.route ?? 'planet'))}><span>{t(z.fix.label)}</span><ArrowRight size={14} /></button></li>)}</ul>
    </section>}

    <div className="mh-grid">
      <section className="mh-next" aria-labelledby="mh-next">
        <h2 id="mh-next" className="mh-h2">{t('Next actions')}</h2>
        <ol>{actions.slice(0, 5).map((z, i) => <li key={z.label}><button onClick={z.go}><span className="mh-n">{String(i + 1).padStart(2, '0')}</span><span><b>{t(z.label)}</b><em>{t(z.why)}</em></span><ArrowRight size={16} strokeWidth={1.6} /></button></li>)}</ol>
      </section>

      <section className="mh-findings" aria-labelledby="mh-findings">
        <h2 id="mh-findings" className="mh-h2">{t('Scientific findings')}</h2>
        {a ? <>
          <p className="mh-verdict">{t('Critic verdict')} <b>{a.verdict}</b> · {t('profile')} “{t(b?.profiles[a.profile]?.label ?? a.profile)}” · {utcShort(a.ranUtc)}{!current && <span className="mh-warn"> · {t('out of date')}</span>}</p>
          <ul className="mh-list">{a.findings.slice(0, 5).map(f => <li key={f.title} className={`f-${f.severity}`}><b>{f.title}</b><span>{f.detail}</span></li>)}</ul>
          <p className="mh-dim">{t('Leading Earth windows')}: {a.top10.slice(0, 3).join(', ')} · {t('index')} <code>{a.bundleSha.slice(0, 10)}</code></p>
          <button className="mh-link" onClick={() => goStep('analysis')}>{t('Inspect every step and statistic')}<ArrowUpRight size={12} /></button>
        </> : <p className="mh-dim">{t('No analysis has been run for this mission yet.')}</p>}
      </section>

      <section className="mh-analogs" aria-labelledby="mh-analogs">
        <h2 id="mh-analogs" className="mh-h2">{t('Earth analogs')}</h2>
        {kept.length ? <ol className="mh-list">{kept.map(id => { const k = b ? b.windows.id.indexOf(id) : -1; return <li key={id}><b>{k >= 0 ? b!.windows.name[k] : id}</b><span>{k >= 0 ? `${b!.windows.country[k] ?? '—'} · ${b!.windows.lat[k].toFixed(2)}°, ${b!.windows.lon[k].toFixed(2)}°` : ''}{agg && k >= 0 ? ` · ${t('fidelity')} ${agg.fidelity[k].toFixed(3)} (${agg.lo[k].toFixed(3)}–${agg.hi[k].toFixed(3)}) · ${t('coverage')} ${(agg.coverage[k] * 100).toFixed(0)} %` : ''}</span></li>; })}</ol>
          : <p className="mh-dim">{t('No Earth analog kept yet.')}</p>}
        {s.inv.analogsFor && x && s.inv.analogsFor !== x.id && <p className="mh-warn">{t('Ranked for a previous site — review them.')}</p>}
        <button className="mh-link" onClick={() => goStep('analogs')}>{t('Explore Earth analogs on the map')}<ArrowUpRight size={12} /></button>
      </section>

      <section className="mh-sims" aria-labelledby="mh-sims">
        <h2 id="mh-sims" className="mh-h2">{t('Simulation results')}</h2>
        {s.inv.experiments.length ? <ul className="mh-list">{s.inv.experiments.map(e => <li key={e.id}><b>{e.name}</b><span>{e.summary.outcome} · {(e.summary.distanceM / 1000).toFixed(2)} km · {(e.summary.durationS / 3600).toFixed(1)} h · {Math.round(e.summary.energyUsedWh)} Wh · {e.site.id} <em className="xp-ev ev-simulated">simulated</em></span></li>)}</ul>
          : <p className="mh-dim">{t('No saved rover experiment yet.')}</p>}
        {campaign && <p className="mh-campaign"><b>{t('Field campaign')}</b> · k = {campaign.k} · {Math.round(campaign.coverage * 100)} % {t('coverage')} · {campaign.sites.map(z => t(siteName(z.id))).join(', ')} <span className="mh-dim">({t(dataModeInfo[dataMode].label)}{appTarget ? `, ${short(appTarget.name.split(/[/,]/)[0]).trim()}` : ''})</span></p>}
      </section>

      <section className="mh-gaps" aria-labelledby="mh-gaps">
        <h2 id="mh-gaps" className="mh-h2">{t('Open questions and data gaps')}</h2>
        <ul className="mh-list">{missing.map(d => <li key={d.id}><b>{d.label}</b><span>{t(d.status.replace('_', ' '))}{d.next ? ` — ${d.next}` : ''}</span></li>)}
          <li><b>{t('Vehicle-scale terrain')}</b><span>{t('Slope and roughness below the elevation-model baseline are not resolved; field verification is needed along any route.')}</span></li>
          <li><b>{t('Soil mechanics')}</b><span>{t('Simulated slip and sinkage are not validated without in-situ bearing and shear tests.')}</span></li>
          {s.inv.answers.slice(-3).map(q => <li key={q.id + q.question}><b>{q.question}</b><span>{t(q.verdict)} · {q.results[0]?.summary}</span></li>)}</ul>
      </section>

      {template && <section className="mh-objectives" aria-labelledby="mh-obj">
        <h2 id="mh-obj" className="mh-h2">{t('Mission objectives')}</h2>
        <ul className="mh-list">{template.objectives.map(o => <li key={o.id}><b>{t(o.name)}</b>{o.description && o.description !== o.name && <span>{t(o.description)}</span>}</li>)}</ul>
        <button className="mh-link" onClick={() => openWorkspace('campaign')}>{t('Weigh objectives in Field Campaign')}<ArrowUpRight size={12} /></button>
      </section>}
    </div>

    <section className="mh-tools" aria-labelledby="mh-tools">
      <h2 id="mh-tools" className="mh-h2">{t('Every EGIZ workspace, in this mission’s context')}</h2>
      {groups.map(g => <div key={g.id} className="mh-tool-group"><p className="eg-eyebrow">{t(g.label)}</p>
        <ul>{WORKSPACES.filter(w => w.group === g.id).map(w => { const note = contextNote(w.route); return <li key={w.route}><button onClick={() => openWorkspace(w.route as Route)}>
          <span className="mh-tool-title">{t(w.title)}</span><span className="mh-tool-text">{t(w.text)}</span>{note && <span className="mh-tool-ctx">{t(note)}</span>}<ArrowUpRight size={18} strokeWidth={1.4} aria-hidden="true" /></button></li>; })}</ul></div>)}
    </section>

    <section id="mh-decide" className="mh-decide" aria-labelledby="mh-decide-h">
      <h2 id="mh-decide-h" className="mh-h2">{t('Your conclusion')}</h2>
      <textarea rows={4} value={draft} onChange={e => setDraft(e.target.value)} placeholder={t('What do you conclude, and what is the next investigation?')} aria-label={t('Conclusion')} />
      <div className="xp-row"><button className="eg-button" disabled={!draft.trim() || draft === s.inv.decision?.text} onClick={() => { s.patchInv({ decision: { text: draft.trim(), utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z') } }); s.log('decision', `Recorded the conclusion: “${draft.trim().slice(0, 140)}”`); }}>{t('Record conclusion')}</button>
        {s.inv.decision && <span className="mh-dim">{t('Recorded')} {utcShort(s.inv.decision.utc)}</span>}
        <button className="eg-button quiet" onClick={report}><Download size={14} /><span>{t('Report (Markdown)')}</span></button>
        <button className="eg-button quiet" onClick={() => downloadText(serializeInvestigation(s.inv), `${s.inv.id}.json`, 'application/json')}><Download size={14} /><span>{t('Mission record (JSON)')}</span></button></div>
    </section>

    <section className="mh-records" aria-labelledby="mh-records">
      <h2 id="mh-records" className="mh-h2">{t('Saved missions')}</h2>
      <ul className="mh-list">{s.saved.slice(0, 8).map(e => <li key={e.id} className={e.id === s.inv.id ? 'on' : ''}><b>{e.title}</b><span>{utcShort(e.updatedUtc)}{e.id === s.inv.id ? ` · ${t('open')}` : ''}</span>{e.id !== s.inv.id && <button className="mh-link" onClick={() => { const err = usePlanet.getState().openInvestigation(e.id); if (err) alert(err); }}><FolderOpen size={12} />{t('Open')}</button>}</li>)}</ul>
      {(s.inv.trail?.length ?? 0) > 0 && <details className="mh-trail"><summary>{t('Investigation trail')} ({s.inv.trail!.length})</summary><ol>{s.inv.trail!.slice(-40).reverse().map((e, i) => <li key={i}><time>{e.utc.slice(5, 16).replace('T', ' ')}</time>{e.text}</li>)}</ol></details>}
      <p className="mh-dim">{t('The guided expedition, Earth analogs and 3D terrain always use the measured index. The data source')} ({t(dataModeInfo[dataMode].label)}) {t('applies to Field Campaign, Engineering Lab and ATLAS-Π.')} <button className="mh-link" onClick={() => { usePlanet.getState().newInvestigation(); }}><RotateCcw size={12} />{t('Start over')}</button></p>
    </section>
  </main>;
}
