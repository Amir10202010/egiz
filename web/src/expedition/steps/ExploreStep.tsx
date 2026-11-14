// EGIZ · step 1, Explore. Rotate and zoom the chosen world, see its regions and the sites EGIZ has measured, and
// choose one to investigate. The surface is a published colour mosaic for orientation only; measured data begins
// with a site's elevation-model fingerprint and, where packaged, its 3D terrain.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Compass, Locate, Minus, Plus, Repeat, X } from 'lucide-react';
import { t } from '../../i18n';
import type { TargetEntry } from '../../discover/types';
import { BODY_LABEL } from '../../planet/terrain/site';
import { usePlanet, type World } from '../../planet/workspace/store';
import { arcDeg, type Globe, type LatLon } from '../../planet/journey/globe';
import { featureValue, FEATURE_INFO, PLACES, WORLD, type Place } from '../../planet/journey/knowledge';
import { GlobeView, type GlobeMarker } from '../GlobeView';
import { goStep } from '../actions';
import { staleItems } from '../journey';
import { writeExpeditionUrl } from '../url';
import { StepHead } from '../ExpeditionPage';
import { fmtLat, fmtLon, KIND, short } from '../format';

const OVERVIEW: Record<World, LatLon & { dist: number }> = { moon: { lat: -38, lon: 20, dist: 2.9 }, mars: { lat: 12, lon: 60, dist: 2.9 } };
const km = (deg: number, w: World) => (deg * Math.PI / 180) * WORLD[w].radiusKm;

export function ExploreStep({ world, focusId }: { world: World; focusId: string | null }) {
  const s = usePlanet(), b = s.bundle;
  const globe = useRef<Globe | null>(null), [ready, setReady] = useState(false), [place, setPlace] = useState<Place | null>(null), [point, setPoint] = useState<LatLon | null>(null), [hover, setHover] = useState<LatLon | null>(null);
  const [view, setView] = useState({ lat: 0, lon: 0, dist: 3 }), [graticule, setGraticule] = useState(true);
  const targets = useMemo(() => b?.targets.filter(x => x.body === world) ?? [], [b, world]);
  const focus = targets.find(x => x.id === focusId) ?? null;
  const fly = (p: { lat: number; lon: number }, dist?: number) => globe.current?.flyTo(p.lat, p.lon, dist ?? (world === 'moon' ? 1.1 : 1.28));
  const focusTarget = (x: TargetEntry) => { setPlace(null); setPoint(null); writeExpeditionUrl({ site: x.id }); fly(x); };

  // Arrival: approach from deep space toward the overview, or straight to the site in the URL / the mission's site.
  const arrived = useRef(false);
  useEffect(() => {
    const g = globe.current; if (!ready || !g || arrived.current) return; arrived.current = true;
    g.view = { ...OVERVIEW[world], dist: 6 };
    const start = focus ?? targets.find(x => x.id === s.inv.target);
    if (start) fly(start, focus ? undefined : 1.9); else g.flyTo(OVERVIEW[world].lat, OVERVIEW[world].lon, OVERVIEW[world].dist, 2200);
  }, [ready, targets.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && focus && arrived.current) fly(focus); }, [focus?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markers: GlobeMarker[] = useMemo(() => [
    ...PLACES[world].map(p => ({ id: `p:${p.name}`, lat: p.lat, lon: p.lon, kind: 'place' as const, label: p.name, on: place?.name === p.name, onClick: () => { setPlace(p); setPoint(null); writeExpeditionUrl({ site: null }); fly(p, world === 'moon' ? 1.35 : 1.45); } })),
    ...targets.map(x => ({ id: `t:${x.id}`, lat: x.lat, lon: x.lon, kind: 'site' as const, label: short(x.name), sub: x.id === s.inv.target ? t('mission site') : s.refs.some(r => r.id === x.id) ? t('3D terrain') : undefined, on: focusId === x.id, onClick: () => focusTarget(x) })),
    ...(point ? [{ id: 'pt', lat: point.lat, lon: point.lon, kind: 'alt' as const, label: `${fmtLat(point.lat)} ${fmtLon(point.lon)}` }] : []),
  ], [world, targets, place, point, focusId, s.refs, s.inv.target]); // eslint-disable-line react-hooks/exhaustive-deps
  const nearest = (p: LatLon) => targets.map(x => ({ x, d: arcDeg(p, x) })).sort((a, c) => a.d - c.d)[0];
  const scaleKm = globe.current ? globe.current.kmPerPixel(WORLD[world].radiusKm) * 120 : null;

  return <div className="xp-explore">
    <div className="xp-map">
      <GlobeView body={world} markers={markers} graticule={graticule} onReady={g => { globe.current = g; setReady(!!g); }} onView={setView} onHover={setHover}
        onPick={p => { const hit = targets.find(x => arcDeg(p, x) < (view.dist - 1) * 2.2); if (hit) { focusTarget(hit); return; } setPoint(p); setPlace(null); writeExpeditionUrl({ site: null }); }}>
        <div className="xp-hud xp-hud-tl"><b>{t(BODY_LABEL[world])}</b><span>{targets.length} {t('measured sites')} · {PLACES[world].length} {t('landmarks')}</span>
          <span className="xp-legend"><i className="lg-site" />{t('measured EGIZ site')} <i className="lg-place" />{t('landmark (context only)')}</span></div>
        <div className="xp-hud xp-hud-tr" role="toolbar" aria-label={t('Globe view')}>
          <button onClick={() => globe.current?.zoomBy(0.6)} aria-label={t('Zoom in')}><Plus size={15} /></button>
          <button onClick={() => globe.current?.zoomBy(1.6)} aria-label={t('Zoom out')}><Minus size={15} /></button>
          <button onClick={() => globe.current?.flyTo(OVERVIEW[world].lat, OVERVIEW[world].lon, OVERVIEW[world].dist)} aria-label={t('Whole planet')} title={t('Whole planet')}><Compass size={15} /></button>
          {world === 'moon' && <button onClick={() => globe.current?.flyTo(-88.4, 0, 1.12)} title={t('Fly to the south pole, where the measured lunar sites are')}>{t('South pole')}</button>}
          <button className={graticule ? 'on' : ''} aria-pressed={graticule} onClick={() => setGraticule(!graticule)} title={t('Latitude and longitude lines every 30°')}>{t('Grid')}</button>
        </div>
        <div className="xp-hud xp-hud-bl">
          {hover ? <span>{fmtLat(hover.lat)} · {fmtLon(hover.lon)}</span> : <span className="xp-dim">{t('Drag to rotate · scroll or pinch to zoom · click a ◆ site')}</span>}
          {scaleKm && scaleKm < 4000 && <span className="xp-scale"><i />{scaleKm >= 100 ? Math.round(scaleKm / 10) * 10 : scaleKm.toFixed(0)} km</span>}
        </div>
        <p className="xp-hud xp-credit">{t('Surface: colour mosaic for orientation (Solar System Scope, CC BY 4.0) — not a measurement')}</p>
      </GlobeView>
    </div>
    <aside className="xp-side" aria-label={focus ? focus.name : t('Sites on this world')}>
      {focus && b ? <Preview x={focus} hasTerrain={s.refs.some(r => r.id === focus.id)} onClose={() => { writeExpeditionUrl({ site: null }); globe.current?.flyTo(focus.lat, focus.lon, 1.9); }} />
        : place ? <div className="xp-pad"><button className="xp-close" onClick={() => setPlace(null)} aria-label={t('Close')}><X size={15} /></button>
          <p className="eg-eyebrow">{t('Landmark')} · {t(place.kind)}</p><h2 className="xp-h2">{place.name}</h2><p className="xp-coord">{fmtLat(place.lat)} · {fmtLon(place.lon)}</p><p>{t(place.note)}</p>
          <p className="xp-note">{t('Context only — EGIZ holds no measurements here.')}</p>
          {(() => { const n = nearest(place); return n && <button className="xp-link" onClick={() => focusTarget(n.x)}>{t('Nearest measured site')}: {short(n.x.name)} · {Math.round(km(n.d, world)).toLocaleString('en')} km<ArrowRight size={13} /></button>; })()}</div>
        : point ? <div className="xp-pad"><button className="xp-close" onClick={() => setPoint(null)} aria-label={t('Close')}><X size={15} /></button>
          <p className="eg-eyebrow">{t('Selected point')}</p><h2 className="xp-h2">{fmtLat(point.lat)} · {fmtLon(point.lon)}</h2>
          <p>{t('EGIZ analyses places that have a measured terrain fingerprint. This point is shown on the visual mosaic only: there is no elevation model or climate record for it in this build, so no analysis is offered rather than an invented one.')}</p>
          {(() => { const n = nearest(point); return n && <button className="xp-link" onClick={() => focusTarget(n.x)}>{t('Nearest measured site')}: {short(n.x.name)} · {Math.round(km(n.d, world)).toLocaleString('en')} km<ArrowRight size={13} /></button>; })()}</div>
        : <div className="xp-pad">
          <StepHead step="explore">{t(WORLD[world].why)}</StepHead>
          <p className="xp-instruct">{t('Rotate the globe and choose one of the measured sites. Each has an elevation-model fingerprint EGIZ can analyse; landmarks are for orientation.')}</p>
          {!b && <p role="status" className="xp-dim">{s.discoveryError ?? t('Loading the measured site index…')}</p>}
          <ul className="xp-sites">{targets.map(x => { const r = s.refs.find(z => z.id === x.id); return <li key={x.id}><button onClick={() => focusTarget(x)}>
            <span className="xp-site-name"><b>{short(x.name)}</b><em>{x.name.match(/\((.*)\)/)?.[1] ?? t(KIND[x.kind] ?? x.kind)}</em></span>
            <span className="xp-site-meta">{fmtLat(x.lat)} · {fmtLon(x.lon)}{r && <i className="xp-badge">3D {r.postingM} m</i>}{s.inv.target === x.id && <i className="xp-badge on">{t('mission site')}</i>}</span></button></li>; })}</ul>
        </div>}
    </aside>
  </div>;
}

/** Short briefing of a focused site with the decision to investigate it (or to change the mission site to it). */
function Preview({ x, hasTerrain, onClose }: { x: TargetEntry; hasTerrain: boolean; onClose(): void }) {
  const s = usePlanet(), b = s.bundle!, current = s.inv.target, isCurrent = current === x.id, measured = b.dimensions.filter(d => x.dimension_status[d.id] === 'measured').length;
  const [confirm, setConfirm] = useState(false); useEffect(() => setConfirm(false), [x.id]);
  const fine = x.body === 'moon' ? 'f100' : 'f400', facts: [string, number | null, string][] = [[`slope_${fine}_p50_deg`, featureValue(x, `slope_${fine}_p50_deg`), '°'], ['relief_m', featureValue(x, 'relief_m'), ' m'], ['noon_elevation_max_deg', featureValue(x, 'noon_elevation_max_deg'), '°']];
  const choose = () => { usePlanet.getState().investigate(x.id, current ? 'switch' : 'chosen'); goStep('site', x.id); };
  // What the change would put out of date, computed against the hypothetical new site.
  const consequences = current && !isCurrent ? staleItems({ ...s, inv: { ...s.inv, target: x.id }, weights: s.weights } as typeof s) : [];
  return <div className="xp-pad xp-preview">
    <button className="xp-close" onClick={onClose} aria-label={t('Back to all sites')}><X size={15} /></button>
    <p className="eg-eyebrow">{t(KIND[x.kind] ?? x.kind)} · {t(BODY_LABEL[x.body])}</p>
    <h2 className="xp-h2">{short(x.name)}</h2>
    <p className="xp-coord"><Locate size={12} /> {fmtLat(x.lat)} · {fmtLon(x.lon)}</p>
    <p>{x.significance}</p>
    <dl className="xp-quick">{facts.filter(f => f[1] !== null).map(([k, v, u]) => <div key={k}><dt>{t(FEATURE_INFO[k]?.label ?? k)}</dt><dd>{v!.toFixed(FEATURE_INFO[k]?.digits ?? 1)}{u}</dd></div>)}
      <div><dt>{t('Dimensions with evidence')}</dt><dd>{measured} / {b.dimensions.length}</dd></div>
      <div><dt>{t('Measured 3D terrain')}</dt><dd>{hasTerrain ? t('packaged') : t('not packaged')}</dd></div></dl>
    <p className="xp-dim xp-small">{t('From')} {x.dem}.</p>
    {isCurrent ? <button className="eg-button" onClick={() => goStep('site', x.id)}>{t('Continue the investigation')}<ArrowRight size={16} strokeWidth={1.6} /></button>
      : current && !confirm ? <button className="eg-button" onClick={() => setConfirm(true)}><Repeat size={15} />{t('Make this the mission site')}</button>
      : !current ? <button className="eg-button" onClick={choose}>{t('Investigate this site')}<ArrowRight size={16} strokeWidth={1.6} /></button> : null}
    {confirm && <div className="xp-confirm" role="alertdialog" aria-label={t('Change the mission site')}>
      <p><b>{t('Change the mission site to')} {short(x.name)}?</b></p>
      <ul>{consequences.map(c => <li key={c.what}><b>{t(c.what)}</b> — {c.why}</li>)}
        <li>{t('Kept: marks, measurements, simulations and answers — each stays tied to the terrain where it was made. The previous site is recorded as an alternative considered.')}</li></ul>
      <div className="xp-row"><button className="eg-button" onClick={choose}><Repeat size={15} />{t('Change and continue')}</button><button className="eg-button quiet" onClick={() => setConfirm(false)}><span>{t('Keep the current site')}</span></button></div>
    </div>}
  </div>;
}
