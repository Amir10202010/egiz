// EGIZ landing: a film, a studio and one guide. The opening film (Act I) flies Moon → Earth → Moon →
// Mars; a studio object, the EGIZ Navigator, travels with the visitor from the first frame to the
// footer and points at whatever matters. Every figure is read from the loaded dataset.
// AI-assisted implementation; human review pending.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { t as tr, useLanguage, setLanguage } from '../i18n';
import { useAppStore, type Route } from '../state/store';
import type { AppData, Run, Target } from '../types/contracts';
import { hasSyntheticData } from '../data/load';
import { MissionGlyph } from '../mission/MissionGlyph';
import { setLaunchIntent, type LaunchOverrides } from '../mission/launchIntent';
import type { Mode } from '../mission/types';
import { loadCinema, type CinemaAsset } from './cinema/cinema';
import { MatchChapter } from './match/MatchChapter';
import { FilmAct } from './film/FilmAct';
import { Reticle } from './film/Reticle';
import { Navigator } from './navigator/Navigator';
import { ScrubScene } from './film/ScrubScene';
import { Soundscape } from './world/soundscape';
import copy from '../content/copy.json';
import './landing.css';

type Lang = 'en' | 'ru';
const L = <T,>(lang: Lang, en: T, ru: T) => (lang === 'ru' ? ru : en);

interface Param { key: string; group: 'rover' | 'vehicle'; en: string; ru: string; unit: string; min: number; max: number; step: number; value: number; maxFrom?: string }
const PARAMS: Record<Mode, Param[]> = {
  rover: [
    { key: 'speed', group: 'rover', en: 'Cruise speed', ru: 'Скорость', unit: 'm/s', min: 0.2, max: 2, step: 0.1, value: 0.8 },
    { key: 'maxSlope', group: 'rover', en: 'Slope limit', ru: 'Предел уклона', unit: '°', min: 5, max: 30, step: 1, value: 15 },
    { key: 'batteryWh', group: 'rover', en: 'Battery', ru: 'Батарея', unit: 'Wh', min: 1000, max: 10000, step: 500, value: 3000 },
  ],
  launch: [
    { key: 'thrust', group: 'vehicle', en: 'Thrust', ru: 'Тяга', unit: 'N', min: 10000, max: 60000, step: 1000, value: 24000 },
    { key: 'fuel', group: 'vehicle', en: 'Propellant', ru: 'Топливо', unit: 'kg', min: 200, max: 1500, step: 50, value: 600 },
    { key: 'angle', group: 'vehicle', en: 'Tilt', ru: 'Наклон', unit: '°', min: 0, max: 30, step: 1, value: 0 },
  ],
  descent: [
    { key: 'initialAltitude', group: 'vehicle', en: 'Start altitude', ru: 'Высота', unit: 'm', min: 400, max: 3000, step: 100, value: 1200 },
    { key: 'initialVelocity', group: 'vehicle', en: 'Vertical speed', ru: 'Скорость', unit: 'm/s', min: -80, max: -5, step: 1, value: -35 },
    { key: 'ignitionAltitude', group: 'vehicle', en: 'Ignition', ru: 'Включение', unit: 'm', min: 100, max: 2900, step: 50, value: 800, maxFrom: 'initialAltitude' },
  ],
  eva: [
    { key: 'speed', group: 'rover', en: 'Walking speed', ru: 'Скорость', unit: 'm/s', min: 0.5, max: 2, step: 0.1, value: 1 },
    { key: 'maxSlope', group: 'rover', en: 'Slope limit', ru: 'Предел уклона', unit: '°', min: 10, max: 30, step: 1, value: 20 },
    { key: 'batteryWh', group: 'rover', en: 'Energy', ru: 'Запас энергии', unit: 'Wh', min: 1000, max: 6000, step: 250, value: 3000 },
  ],
};
const paramMax = (p: Param, v: Record<string, number>) => p.maxFrom ? Math.min(p.max, (v[p.maxFrom] ?? p.max) - p.step) : p.max;
const paramValue = (p: Param, v: Record<string, number>) => Math.min(v[p.key] ?? p.value, paramMax(p, v));
const defaultsFor = (m: Mode) => Object.fromEntries(PARAMS[m].map(p => [p.key, p.value]));
const MODES: { mode: Mode; en: string; ru: string }[] = [
  { mode: 'rover', en: 'Rover', ru: 'Ровер' }, { mode: 'launch', en: 'Launch', ru: 'Старт' },
  { mode: 'descent', en: 'Landing', ru: 'Посадка' }, { mode: 'eva', en: 'Moonwalk', ru: 'Выход' },
];

const siteName = (data: AppData, id: string) => (data.candidates.tiles.find(t => t.id === id)?.name ?? id).replace(/ regional window$/i, '');
const firstSite = (run: Run | undefined) => run?.campaigns.find(c => c.k === 1) ?? run?.campaigns[0];
const shortName = (name: string) => name.split(/[/,]/)[0].trim();

/** Elements marked .lx-in rise out of blur as they enter; --i staggers siblings. */
function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current; if (!host || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    host.querySelectorAll('.lx-in:not(.is-in)').forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}
/** Buttons lean toward the pointer. */
function useMagnets(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current; if (!host || !window.matchMedia?.('(pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('.lx-mag'); if (!el) return;
      const r = el.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(dx * .18).toFixed(1)}px, ${(dy * .28).toFixed(1)}px)`;
    };
    const out = (e: PointerEvent) => { const el = (e.target as Element | null)?.closest<HTMLElement>('.lx-mag'); if (el && !el.contains(e.relatedTarget as Node)) el.style.transform = ''; };
    host.addEventListener('pointermove', move); host.addEventListener('pointerout', out);
    return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerout', out); };
  }, [root]);
}
/** Which of n equal steps a tall section is on as it scrolls through. */
function useSectionStep(ref: React.RefObject<HTMLElement | null>, steps: number) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => { raf = 0; const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))); setStep(Math.min(steps - 1, Math.floor(p * steps * .999))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); if (raf) cancelAnimationFrame(raf); };
  }, [ref, steps]);
  return step;
}

function Counter({ value, suffix = '', lang }: { value: number; suffix?: string; lang: Lang }) {
  const [v, setV] = useState(0); const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current; if (!node || typeof IntersectionObserver === 'undefined') { setV(value); return; } let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect(); const t0 = performance.now();
      const step = (now: number) => { const k = Math.min(1, (now - t0) / 1400); setV(value * (1 - Math.pow(1 - k, 4))); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    });
    io.observe(node); return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={el}>{Math.round(v).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}{suffix}</span>;
}

export function HomePage() {
  const lang = useLanguage(s => s.language) as Lang;
  const { data, navigate, setTarget } = useAppStore();
  const root = useRef<HTMLElement>(null);
  const studio = useRef<HTMLElement>(null);
  const [films, setFilms] = useState<CinemaAsset[]>([]);
  const [menu, setMenu] = useState(false);
  const [destination, setDestination] = useState<'moon' | 'mars'>('moon');
  const [mode, setMode] = useState<Mode>('rover');
  const [params, setParams] = useState<Record<string, number>>(() => defaultsFor('rover'));
  const [soundOn, setSoundOn] = useState(false);
  const sound = useRef<Soundscape | null>(null);
  const studioStep = useSectionStep(studio, 3);
  useReveal(root); useMagnets(root);

  useEffect(() => { const c = new AbortController(); loadCinema(c.signal).then(a => { if (!c.signal.aborted) setFilms(a); }); return () => c.abort(); }, []);
  useEffect(() => () => sound.current?.dispose(), []);
  useEffect(() => { if (!menu) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [menu]);
  const toggleSound = async () => {
    if (!sound.current) sound.current = new Soundscape();
    if (sound.current.on) { sound.current.disable(); setSoundOn(false); }
    else { try { await sound.current.enable(); sound.current.setMix({ vacuum: .55, mars: .25, earth: .2 }); setSoundOn(true); } catch { setSoundOn(false); } }
  };

  const moon = data?.targets.targets.find(t => t.body === 'moon' && t.kind !== 'validation_only') ?? data?.targets.targets.find(t => t.body === 'moon');
  const mars = data?.targets.targets.find(t => t.body === 'mars' && t.kind !== 'validation_only') ?? data?.targets.targets.find(t => t.body === 'mars');
  const runFor = useCallback((t?: Target) => t && data?.results.runs.find(r => r.target === t.id), [data]);
  const scroller = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  const gaps = useMemo(() => Array.from(new Map([...(runFor(moon)?.gaps.physical ?? []), ...(runFor(mars)?.gaps.physical ?? [])].map(g => [g.gap, g])).values()), [runFor, moon, mars]);

  if (!data) return null;
  const synthetic = hasSyntheticData(data);
  const tiles = data.candidates.tiles.filter(t => t.pool !== 'control').length;
  const marsFirst = firstSite(runFor(mars));
  const marsTwin = marsFirst?.sites[0] ? tr(shortName(siteName(data, marsFirst.sites[0].id))) : null;
  const open = (route: Route, target?: Target) => { if (target) setTarget(target.id); navigate(route); window.scrollTo({ top: 0 }); };
  const launch = (autorun: boolean) => {
    const overrides: LaunchOverrides = {};
    for (const p of PARAMS[mode]) { const g = (overrides[p.group] ??= {}) as Record<string, number>; g[p.key] = paramValue(p, params); }
    setLaunchIntent(mode, overrides, autorun); open('lab', destination === 'mars' ? mars : moon);
  };
  const routes = (Object.keys(copy.nav) as Route[]).filter((r): r is Exclude<Route, 'home'> => r !== 'home');
  const navLabel = (r: Route) => tr((copy.nav as Record<string, string>)[r]);
  const cards = [
    { id: 'lx-card-0', n: '01', en: 'Point at a world', ru: 'Укажите цель', sub: L(lang, 'The Moon or Mars. A real landing region, measured from orbit.', 'Луна или Марс. Реальный район посадки, измеренный с орбиты.'), metric: null as null | { v: number; s: string; label: string } },
    { id: 'lx-card-1', n: '02', en: 'EGIZ searches Earth', ru: 'EGIZ ищет на Земле', sub: L(lang, 'Slopes, roughness, light and cold — scored for every place.', 'Уклоны, шероховатость, свет и холод — для каждого места.'), metric: { v: tiles, s: '', label: L(lang, 'places scored', 'мест оценено') } },
    { id: 'lx-card-2', n: '03', en: 'An honest answer', ru: 'Честный ответ', sub: L(lang, 'The closest twin — and what no place on Earth can teach.', 'Ближайший двойник — и чему Земля не научит никогда.'), metric: marsFirst ? { v: Math.round(marsFirst.coverage * 100), s: '%', label: L(lang, `of Mars objectives${marsTwin ? ` · ${marsTwin}` : ''}`, `целей Марса${marsTwin ? ` · ${marsTwin}` : ''}`) } : null },
  ];
  const act = films.filter(f => f.mode === 'film');
  const finale = films.find(f => f.id === 'S7');

  return <main ref={root} className="lx" aria-labelledby="hm-title">
    <Navigator />
    <Reticle />

    {/* ---------- header: one floating capsule ---------- */}
    <header className="lx-head">
      <button className="lx-brand lx-mag" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="EGIZ">
        <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7" fill="currentColor" /><path d="M3 18.5h26" stroke="#07080b" strokeWidth="2.4" /><path d="M5.5 11.5a12 12 0 0 1 22 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        <span>EGIZ</span>
      </button>
      <nav className="lx-links" aria-label={L(lang, 'Main', 'Основное')}>
        {(['discover', 'lab', 'studio', 'evidence'] as const).filter(r => (routes as string[]).includes(r)).map(r => <button key={r} onClick={() => open(r)}>{navLabel(r)}</button>)}
      </nav>
      <div className="lx-tools">
        <button className="lx-pill lx-ghost lx-icon" aria-pressed={soundOn} onClick={toggleSound} aria-label={soundOn ? L(lang, 'Sound off', 'Выключить звук') : L(lang, 'Sound on', 'Включить звук')}>{soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
        <div className="lx-lang" role="group" aria-label={L(lang, 'Language', 'Язык')}>
          <button aria-pressed={lang === 'ru'} onClick={() => setLanguage('ru')}>RU</button><button aria-pressed={lang === 'en'} onClick={() => setLanguage('en')}>EN</button>
        </div>
        <button className="lx-pill lx-cta lx-mag" onClick={scroller('lx-mission')}>{L(lang, 'Plan a mission', 'Спланировать')}<ArrowRight size={15} /></button>
        <button className="lx-pill lx-ghost lx-icon" aria-expanded={menu} aria-label={L(lang, 'All tools', 'Все инструменты')} onClick={() => setMenu(true)}><Menu size={17} /></button>
      </div>
    </header>

    {menu && <div className="lx-menu" role="dialog" aria-modal="true" aria-label={L(lang, 'All tools', 'Все инструменты')}>
      <button className="lx-pill lx-ghost lx-icon lx-menu-close" onClick={() => setMenu(false)} aria-label={L(lang, 'Close', 'Закрыть')} autoFocus><X size={18} /></button>
      <p className="lx-eyebrow">{L(lang, 'Inside EGIZ', 'Внутри EGIZ')}</p>
      <div className="lx-menu-grid">{routes.map((r, i) => <button key={r} className="lx-tile" style={{ '--i': i } as React.CSSProperties} onClick={() => { setMenu(false); open(r); }}>
        <span className="lx-tile-n">{String(i + 1).padStart(2, '0')}</span><span className="lx-tile-t">{navLabel(r)}</span><ArrowUpRight size={18} />
      </button>)}</div>
    </div>}

    {/* ---------- ACT I · the film ---------- */}
    {act.length > 0 && <FilmAct lang={lang} clips={act} hMax={moon?.h_max_deg ?? null} soundOn={soundOn} onCover={() => {}} onPlan={scroller('lx-mission')} onFinish={() => {}} />}

    {/* ---------- the studio: what EGIZ does, in three moves ---------- */}
    <section ref={studio} className="lx-studio" data-nav="0.5 0.44 1.15 1" data-nav-m="0.5 0.42 1 1" data-nav-look={cards[studioStep].id} data-step={studioStep}>
      <div className="lx-studio-frame">
        <div className="lx-spot" aria-hidden="true" />
        <div className="lx-floor" aria-hidden="true" />
        <div className="lx-studio-head">
          <p className="lx-eyebrow lx-in">{L(lang, 'What EGIZ does', 'Что делает EGIZ')}</p>
          <h2 className="lx-h lx-in" style={{ '--i': 1 } as React.CSSProperties}>{L(lang, 'Rehearse other worlds on this one.', 'Репетиция других миров — на этом.')}</h2>
        </div>
        <div className="lx-cards">
          {cards.map((c, i) => <article key={c.id} id={c.id} className={`lx-card ${studioStep === i ? 'is-active' : ''} ${studioStep > i ? 'is-past' : ''}`} style={{ '--i': i } as React.CSSProperties}>
            <span className="lx-card-n">{c.n}</span>
            <h3>{L(lang, c.en, c.ru)}</h3>
            <p>{c.sub}</p>
            {c.metric && <p className="lx-metric"><b><Counter value={c.metric.v} suffix={c.metric.s} lang={lang} /></b><span>{c.metric.label}</span></p>}
          </article>)}
        </div>
      </div>
    </section>

    {/* ---------- one ground, two planets ---------- */}
    <MatchChapter data={data} lang={lang} synthetic={synthetic} films={films.filter(f => f.mode === 'inline')} />

    {/* ---------- what Earth cannot teach ---------- */}
    {gaps.length > 0 && <section className="lx-limits" data-nav="0.09 0.3 0.45 0" data-nav-m="0.84 0.13 0.42 0" data-nav-look="lx-limits-rows">
      <p className="lx-eyebrow lx-in">{L(lang, 'The limits', 'Пределы')}</p>
      <h2 className="lx-h lx-in" style={{ '--i': 1 } as React.CSSProperties}>{L(lang, 'What Earth cannot teach.', 'Чему Земля не научит.')}</h2>
      <div id="lx-limits-rows" className="lx-rows lx-in" style={{ '--i': 2 } as React.CSSProperties}>
        {[0, 1].map(row => <div key={row} className={`lx-row ${row ? 'is-rev' : ''}`}><div className="lx-track">
          {[...gaps, ...gaps, ...gaps].map((g, i) => <span key={i} className={`lx-chip ${row ? 'is-alt' : ''}`} aria-hidden={i >= gaps.length}>{tr(row ? g.alternative : g.gap)}</span>)}
        </div></div>)}
      </div>
      <p className="lx-note lx-in" style={{ '--i': 3 } as React.CSSProperties}>{L(lang, 'Above: what no field site reproduces. Below: the facility that can.', 'Сверху — чего не воспроизведёт ни один полигон. Снизу — установка, которая сможет.')}</p>
    </section>}

    {/* ---------- your mission ---------- */}
    <section id="lx-mission" className="lx-mission" data-nav="0.17 0.62 1.05 1" data-nav-m="0.86 0.14 0.42 0" data-nav-look="lx-go">
      <div className="lx-mission-bg" aria-hidden="true" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}media/cinematic/hero/s1-arrival-end.jpg)` }} />
      <div className="lx-mission-copy">
        <p className="lx-eyebrow lx-in">{L(lang, 'Your mission', 'Ваша миссия')}</p>
        <h2 className="lx-h lx-in" style={{ '--i': 1 } as React.CSSProperties}>{L(lang, 'Choose. Set. Fly it.', 'Выберите. Настройте. Запустите.')}</h2>
      </div>
      <div className="lx-panel lx-in" style={{ '--i': 2 } as React.CSSProperties} role="group" aria-label={L(lang, 'Plan a mission', 'Планирование миссии')}>
        <div className="lx-seg" role="radiogroup" aria-label={L(lang, 'Destination', 'Цель')}>
          {([['moon', moon, L(lang, 'Moon', 'Луна')], ['mars', mars, L(lang, 'Mars', 'Марс')]] as const).filter(([, t]) => t).map(([b, t, label]) => <button key={b} role="radio" aria-checked={destination === b} onClick={() => setDestination(b)}>
            <span>{label}</span><small>{t ? shortName(t.name) : ''}</small>
          </button>)}
        </div>
        <div className="lx-modes" role="radiogroup" aria-label={L(lang, 'Mission type', 'Тип миссии')}>
          {MODES.map(m => <button key={m.mode} role="radio" aria-checked={mode === m.mode} onClick={() => { setMode(m.mode); setParams(defaultsFor(m.mode)); }}>
            <MissionGlyph mode={m.mode} /><span>{L(lang, m.en, m.ru)}</span>
          </button>)}
        </div>
        <div className="lx-params">
          {PARAMS[mode].map(p => { const max = paramMax(p, params), v = paramValue(p, params); return <label key={p.key} className="lx-param">
            <span><em>{L(lang, p.en, p.ru)}</em><output>{v.toLocaleString(lang)}<small> {p.unit}</small></output></span>
            <input type="range" min={p.min} max={max} step={p.step} value={v} onChange={e => setParams(s => ({ ...s, [p.key]: Number(e.target.value) }))} style={{ '--fill': `${((v - p.min) / (max - p.min)) * 100}%` } as React.CSSProperties} />
          </label>; })}
        </div>
        <button id="lx-go" className="lx-go lx-mag" onClick={() => launch(true)}><span>{L(lang, 'Run the simulation', 'Запустить расчёт')}</span><ArrowRight size={18} /></button>
        <button className="lx-quiet" onClick={() => launch(false)}>{L(lang, 'Open the lab without running', 'Открыть лабораторию без запуска')}</button>
      </div>
    </section>

    {/* ---------- finale: home ---------- */}
    {finale && <ScrubScene clip={finale} lang={lang} nav="0.3 0.28 0.5 0" kicker={L(lang, 'Made in Astana', 'Сделано в Астане')} title={L(lang, 'Earth first.\nThen everything else.', 'Сначала — Земля.\nПотом — всё остальное.')} />}

    {/* ---------- footer ---------- */}
    <footer className="lx-foot" data-nav="0.84 0.42 0.75 1">
      <div className="lx-foot-card lx-in">
        <div className="lx-foot-mark" aria-hidden="true">EGIZ</div>
        <div className="lx-foot-grid">
          <div>
            <p className="lx-eyebrow">{L(lang, 'Tools', 'Инструменты')}</p>
            <div className="lx-foot-pills">{routes.map(r => <button key={r} className="lx-pill lx-ghost" onClick={() => open(r)}>{navLabel(r)}</button>)}</div>
          </div>
          <div className="lx-foot-fine">
            <p>{L(lang, 'An independent student project for the NASA Space Apps Challenge 2026. Not affiliated with or endorsed by NASA.', 'Независимый студенческий проект для NASA Space Apps Challenge 2026. Не связан с NASA и не одобрен ею.')}</p>
            <p>{L(lang, 'The films are illustrative, generated with Veo. Terrain figures come from NASA PGDA lunar altimetry, a measured Jezero package and Copernicus DEM. The Navigator is a 3D rendering of the EGIZ mark.', 'Фильмы — иллюстрация, созданная в Veo. Цифры рельефа — из лунной альтиметрии NASA PGDA, измеренного пакета Езеро и Copernicus DEM. Навигатор — 3D-образ знака EGIZ.')}{synthetic ? L(lang, ' Some figures use demo data.', ' Часть цифр — демо-данные.') : ''}</p>
            <p className="lx-foot-meta"><span>© 2026 EGIZ</span><button className="lx-pill lx-ghost" onClick={() => open('evidence')}>{L(lang, 'Sources & limits', 'Источники и пределы')}<ArrowUpRight size={14} /></button></p>
          </div>
        </div>
      </div>
    </footer>
  </main>;
}
