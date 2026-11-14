// EGIZ landing narrative. Every figure on this page is read from the loaded dataset.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Lenis from 'lenis';
import { t as tr, useLanguage } from '../i18n';
import { useAppStore, type Route } from '../state/store';
import type { AppData, Run, Target } from '../types/contracts';
import { hasSyntheticData } from '../data/load';
import { MissionGlyph } from '../mission/MissionGlyph';
import { setLaunchIntent, type LaunchOverrides } from '../mission/launchIntent';
import type { Mode } from '../mission/types';
import './home.css';

interface Param { key: string; group: 'rover' | 'vehicle'; en: string; ru: string; unit: string; min: number; max: number; step: number; value: number; maxFrom?: string }
/** The few inputs that change each expedition the most; everything else stays in the lab. */
const PARAMS: Record<Mode, Param[]> = {
  rover: [
    { key: 'speed', group: 'rover', en: 'Cruise speed', ru: 'Скорость', unit: 'm/s', min: 0.2, max: 2, step: 0.1, value: 0.8 },
    { key: 'maxSlope', group: 'rover', en: 'Slope limit', ru: 'Предел уклона', unit: '°', min: 5, max: 30, step: 1, value: 15 },
    { key: 'batteryWh', group: 'rover', en: 'Battery', ru: 'Батарея', unit: 'Wh', min: 1000, max: 10000, step: 500, value: 3000 },
  ],
  launch: [
    { key: 'thrust', group: 'vehicle', en: 'Thrust', ru: 'Тяга', unit: 'N', min: 10000, max: 60000, step: 1000, value: 24000 },
    { key: 'fuel', group: 'vehicle', en: 'Propellant', ru: 'Топливо', unit: 'kg', min: 200, max: 1500, step: 50, value: 600 },
    { key: 'angle', group: 'vehicle', en: 'Tilt from vertical', ru: 'Наклон', unit: '°', min: 0, max: 30, step: 1, value: 0 },
  ],
  descent: [
    { key: 'initialAltitude', group: 'vehicle', en: 'Start altitude', ru: 'Начальная высота', unit: 'm', min: 400, max: 3000, step: 100, value: 1200 },
    { key: 'initialVelocity', group: 'vehicle', en: 'Vertical speed', ru: 'Вертикальная скорость', unit: 'm/s', min: -80, max: -5, step: 1, value: -35 },
    { key: 'ignitionAltitude', group: 'vehicle', en: 'Engine ignition', ru: 'Включение двигателя', unit: 'm', min: 100, max: 2900, step: 50, value: 800, maxFrom: 'initialAltitude' },
  ],
  eva: [
    { key: 'speed', group: 'rover', en: 'Walking speed', ru: 'Скорость', unit: 'm/s', min: 0.5, max: 2, step: 0.1, value: 1 },
    { key: 'maxSlope', group: 'rover', en: 'Slope limit', ru: 'Предел уклона', unit: '°', min: 10, max: 30, step: 1, value: 20 },
    { key: 'batteryWh', group: 'rover', en: 'Life-support energy', ru: 'Запас энергии', unit: 'Wh', min: 1000, max: 6000, step: 250, value: 3000 },
  ],
};
const paramMax = (p: Param, values: Record<string, number>) => p.maxFrom ? Math.min(p.max, (values[p.maxFrom] ?? p.max) - p.step) : p.max;
const paramValue = (p: Param, values: Record<string, number>) => Math.min(values[p.key] ?? p.value, paramMax(p, values));
const defaultsFor = (mode: Mode) => Object.fromEntries(PARAMS[mode].map(p => [p.key, p.value]));

const EXPEDITIONS: { mode: Mode; en: string; ru: string; textEn: string; textRu: string }[] = [
  { mode: 'rover', en: 'Rover traverse', ru: 'Маршрут ровера', textEn: 'Drive across measured terrain', textRu: 'Проехать по измеренному рельефу' },
  { mode: 'launch', en: 'Launch & flight', ru: 'Взлёт и полёт', textEn: 'Test a rocket launch', textRu: 'Испытать запуск ракеты' },
  { mode: 'descent', en: 'Descent & landing', ru: 'Спуск и посадка', textEn: 'Try a surface landing', textRu: 'Попробовать посадку' },
  { mode: 'eva', en: 'Habitat & EVA', ru: 'База и выход', textEn: 'Plan surface exploration', textRu: 'Спланировать выход на поверхность' },
];

type Lang = 'en' | 'ru';
const L = <T,>(lang: Lang, en: T, ru: T) => (lang === 'ru' ? ru : en);
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Pick the rendition by the screen's real pixels: phones 720p, laptops 1080p, large or dense screens 1440p. */
const CLIP_RES = (() => {
  if (typeof window === 'undefined') return 1080;
  const px = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2);
  return px < 1000 ? 720 : px < 1800 ? 1080 : 1440;
})();
/** A generated film clip in place of a still: plays when it is on screen, holds its last frame, replays on return.
 *  Visitors who asked for less motion get the last frame as a still. */
function Clip({ base, active = true, parallax, eager, scrub }: { base: string; active?: boolean; parallax?: string; eager?: boolean; scrub?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    const v = ref.current; if (!v || reduced || scrub) return;
    if (!active) { v.pause(); return; }
    if (typeof IntersectionObserver === 'undefined') { v.play().catch(() => {}); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > .3) { if (v.ended) v.currentTime = 0; v.play().catch(() => {}); } else v.pause();
    }, { threshold: [0, .3] });
    io.observe(v); return () => io.disconnect();
  }, [active, reduced, scrub]);
  if (reduced) return <img data-parallax={parallax} src={asset(`${base}-end.jpg`)} alt="" decoding="async" />;
  // scrubbed clips are driven by the scroll (useSpatial); the rest play while visible
  return <video ref={ref} data-parallax={scrub ? undefined : parallax} data-scrub={scrub ? '' : undefined} muted playsInline preload={eager ? 'auto' : 'metadata'} poster={asset(`${base}.jpg`)} src={asset(`${base}-${CLIP_RES}.mp4`)} />;
}

function coord(value: number, pos: string, neg: string) { return `${Math.abs(value).toFixed(2)}°${value >= 0 ? pos : neg}`; }
function latLon(lang: Lang, lat: number, lon: number) {
  return lang === 'ru' ? `${coord(lat, ' с.ш.', ' ю.ш.')} · ${coord(lon, ' в.д.', ' з.д.')}` : `${coord(lat, 'N', 'S')} · ${coord(lon, 'E', 'W')}`;
}
const pct = (v: number) => `${Math.round(v * 100)}`;

/** Fades and lifts elements tagged with data-reveal as they enter the viewport. */
function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current; if (!host) return;
    const nodes = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { nodes.forEach(n => n.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, [root]);
}

/** Slow parallax on full-bleed plates; disabled for reduced motion. */
function useParallax(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current; if (!host || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const plates = Array.from(host.querySelectorAll<HTMLElement>('[data-parallax]'));
    let frame = 0;
    const tick = () => {
      frame = 0; const vh = window.innerHeight;
      for (const p of plates) {
        const r = p.parentElement!.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const progress = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        p.style.transform = `translate3d(0, ${(progress * Number(p.dataset.parallax)).toFixed(1)}px, 0) scale(1.08)`;
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
    tick(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [root]);
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return <div className="hm-spec"><dt>{label}</dt><dd>{children}</dd></div>;
}

function siteName(data: AppData, id: string) {
  const tile = data.candidates.tiles.find(t => t.id === id);
  return (tile?.name ?? id).replace(/ regional window$/i, '');
}
function bestCampaign(run: Run | undefined) {
  if (!run?.campaigns.length) return null;
  return run.campaigns.reduce((a, b) => (b.k > a.k ? b : a));
}

/** Which motion each element gets, by its role on the page. */
function motionFor(el: HTMLElement, i: number): string {
  if (el.closest('.hm-plate-copy') && el.matches('h2')) return 'scene';
  if (el.matches('.eg-eyebrow')) return 'left';
  if (el.matches('.hm-statement')) return 'depth';
  if (el.matches('.hm-target-figure')) return 'door';
  if (el.matches('.hm-steps li, .hm-result, .hm-specs')) return 'flip';
  if (el.matches('.hm-ledger li')) return i % 2 ? 'right' : 'left-far';
  if (el.matches('h2')) return 'tilt';
  return 'rise';
}

/** Spatial scroll: inertial smooth scrolling; pinned film plates follow the scroll frame by frame;
 *  every content element moves through the scene in its own way as it arrives and leaves.
 *  Off for reduced motion (then the page is plain and still). */
function useSpatial(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current; if (!host || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    // inertial scrolling: wheel and trackpad glide instead of stepping
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, autoRaf: true });
    // assign motions once; the ledger alternates sides
    const movers = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal]')).filter(el => !el.closest('.hm-hero'));
    let ledger = 0;
    movers.forEach(el => { el.dataset.sp = motionFor(el, el.matches('.hm-ledger li') ? ledger++ : 0); });
    const smoothed = new WeakMap<HTMLVideoElement, number>();
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - last) / 1000); last = now; const vh = window.innerHeight;
      for (const el of movers) {
        const r = el.getBoundingClientRect(); if (r.top > vh * 1.15 || r.bottom < -vh * .15) continue;
        el.style.setProperty('--sp', clamp((vh * .98 - r.top) / (vh * .55)).toFixed(3));
        el.style.setProperty('--sx', clamp((vh * .16 - r.bottom) / (vh * .24)).toFixed(3));
      }
      host.querySelectorAll<HTMLElement>('.hm-plate-scrub').forEach(sec => {
        const r = sec.getBoundingClientRect(); const v = sec.querySelector<HTMLVideoElement>('video[data-scrub]');
        if (r.top > vh * 1.5 || r.bottom < -vh * .5) return;
        if (v && v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
        const p = clamp(-r.top / Math.max(1, r.height - vh)); sec.style.setProperty('--p', p.toFixed(4));
        if (!v || v.readyState < 2 || !v.duration) return;
        const prev = smoothed.get(v) ?? p; const sp = prev + (p - prev) * (1 - Math.exp(-dt * 14)); smoothed.set(v, sp);
        if (!v.paused) v.pause();
        // one seek at a time: queuing seeks while the decoder is busy is what makes scrubbing stutter
        const t = sp * (v.duration - .05);
        if (!v.seeking && Math.abs(v.currentTime - t) > 1 / 60) v.currentTime = t;
      });
      const foot = host.querySelector<HTMLElement>('[data-spatial-footer]');
      if (foot) { const r = foot.getBoundingClientRect(); foot.style.setProperty('--set', clamp((vh - r.top) / (r.height + vh * .2)).toFixed(3)); }
    };
    host.classList.add('is-spatial');
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); host.classList.remove('is-spatial'); movers.forEach(el => { delete el.dataset.sp; }); };
  }, [root]);
}

export function HomePage() {
  const lang = useLanguage(s => s.language) as Lang;
  const { data, navigate, setTarget } = useAppStore();
  const root = useRef<HTMLElement>(null);
  const [destination, setDestination] = useState<'moon' | 'mars'>('moon');
  const [mode, setMode] = useState<Mode>('rover');
  const [params, setParams] = useState<Record<string, number>>(() => defaultsFor('rover'));
  const chooseMode = (next: Mode) => { setMode(next); setParams(defaultsFor(next)); };
  useReveal(root); useParallax(root); useSpatial(root);
  if (!data) return null;

  const moon = data.targets.targets.find(t => t.body === 'moon' && t.kind !== 'validation_only') ?? data.targets.targets.find(t => t.body === 'moon');
  const mars = data.targets.targets.find(t => t.body === 'mars' && t.kind !== 'validation_only') ?? data.targets.targets.find(t => t.body === 'mars');
  const runFor = (t?: Target) => t && data.results.runs.find(r => r.target === t.id);
  const templateFor = (t?: Target) => t && data.templates.templates.find(tp => t.templates.includes(tp.id));
  const moonRun = runFor(moon), marsRun = runFor(mars);
  const moonCampaign = bestCampaign(moonRun), marsCampaign = bestCampaign(marsRun);
  const marsTwinId = (marsRun?.campaigns.find(c => c.k === 1) ?? marsRun?.campaigns[0])?.sites[0]?.id;
  const marsTwinName = marsTwinId ? tr(siteName(data, marsTwinId)) : null;
  const tiles = data.candidates.tiles.filter(t => t.pool !== 'control').length;
  const gapRows = Array.from(new Map([...(moonRun?.gaps.physical ?? []), ...(marsRun?.gaps.physical ?? [])].map(g => [g.gap, g])).values());
  const synthetic = hasSyntheticData(data);
  const currentTarget = destination === 'mars' ? mars : moon;
  const open = (route: Route, target?: Target) => { if (target) setTarget(target.id); navigate(route); };
  const startExpedition = (autorun: boolean) => {
    const overrides: LaunchOverrides = {};
    for (const p of PARAMS[mode]) {
      const group = (overrides[p.group] ??= {}) as Record<string, number>;
      group[p.key] = paramValue(p, params);
    }
    setLaunchIntent(mode, overrides, autorun);
    open('lab', destination === 'mars' ? mars : moon);
  };

  const tools: { route: Route; title: string; ru: string; text: string; textRu: string }[] = [
    { route: 'lab', title: 'Engineering lab', ru: 'Инженерная лаборатория', text: 'Measured terrain, vehicles, transfers and surface operations in one 3D workbench.', textRu: 'Измеренный рельеф, техника, перелёты и работа на поверхности — в одном 3D-стенде.' },
    { route: 'campaign', title: 'Campaign', ru: 'Кампания', text: 'Choose objectives and compute the smallest set of Earth sites that covers them.', textRu: 'Выберите цели и рассчитайте минимальный набор земных площадок, который их покрывает.' },
    { route: 'twin', title: 'Same Sun', ru: 'Одно Солнце', text: 'Compare a target and an Earth site under identical solar geometry.', textRu: 'Сравните цель и земную площадку при одинаковой геометрии Солнца.' },
    { route: 'matrix', title: 'Fidelity matrix', ru: 'Матрица соответствия', text: 'Every objective against every site, with the Earth ceiling stated per cell.', textRu: 'Каждая цель против каждой площадки, с пределом Земли в каждой ячейке.' },
    { route: 'evidence', title: 'Evidence', ru: 'Источники', text: 'Sources, pre-registered validation and the limits of every dataset.', textRu: 'Источники, заранее зарегистрированная проверка и ограничения каждого набора данных.' },
    { route: 'brief', title: 'Mission brief', ru: 'Задание миссии', text: 'The mission template, its objectives and the constraints behind them.', textRu: 'Шаблон миссии, его цели и ограничения, на которых они основаны.' },
  ];

  return <main ref={root} className="hm" aria-labelledby="hm-title">
    {/* 01 — Hero */}
    <section className="hm-hero">
      <div className={`hm-hero-plate ${destination === 'moon' ? 'is-active' : ''}`} aria-hidden="true">
        <Clip base="media/cinematic/hero/s1-arrival" active={destination === 'moon'} eager />
      </div>
      {mars && <div className={`hm-hero-plate hm-hero-plate-mars ${destination === 'mars' ? 'is-active' : ''}`} aria-hidden="true">
        <Clip base="media/cinematic/mars/s5-jezero" active={destination === 'mars'} />
      </div>}
      <div className="hm-hero-shade" aria-hidden="true" />
      <div className="hm-hero-grid">
        <div className="hm-hero-copy">
          <p className="eg-eyebrow hm-rise" style={{ '--d': '120ms' } as React.CSSProperties}>{L(lang, 'Egiz — analogue campaign designer', 'Egiz — проектировщик аналоговых кампаний')}</p>
          <h1 id="hm-title" className="eg-display hm-hero-title">
            <span className="hm-line"><span style={{ '--d': '220ms' } as React.CSSProperties}>{L(lang, 'Rehearse', 'Репетиция')}</span></span>
            <span className="hm-line"><span key={destination} className="hm-swap" style={{ '--d': '320ms' } as React.CSSProperties}>{destination === 'mars' ? L(lang, 'Mars', 'Марса') : L(lang, 'the Moon', 'Луны')}</span></span>
            <span className="hm-line"><span style={{ '--d': '420ms' } as React.CSSProperties}>{L(lang, 'on Earth', 'на Земле')}</span></span>
          </h1>
          <p className="hm-hero-lede hm-rise" style={{ '--d': '600ms' } as React.CSSProperties}>{L(lang,
            'Egiz finds the smallest set of places on Earth that can rehearse a mission — and states, plainly, what Earth can never test.',
            'Egiz находит минимальный набор мест на Земле, где можно отрепетировать миссию, — и честно показывает, что Земля проверить не может.')}</p>
          {currentTarget && <p className="hm-hero-coord hm-rise" style={{ '--d': '760ms' } as React.CSSProperties}><span>{currentTarget.name.split(/[/,]/)[0].trim()}</span>{latLon(lang, currentTarget.lat, currentTarget.lon)}</p>}
        </div>

        <aside className="hm-panel hm-rise" style={{ '--d': '520ms' } as React.CSSProperties} aria-label={L(lang, 'New mission', 'Новая миссия')}>
          <p className="hm-panel-kicker">{L(lang, 'New mission', 'Новая миссия')}</p>

          <div className="hm-dest" role="radiogroup" aria-label={L(lang, 'Destination', 'Цель')}>
            {([['moon', moon, L(lang, 'Moon', 'Луна')], ['mars', mars, L(lang, 'Mars', 'Марс')]] as const).filter(([, t]) => t).map(([body, , label]) => <button key={body} role="radio" aria-checked={destination === body} onClick={() => setDestination(body)}>{label}</button>)}
          </div>

          <p className="hm-panel-label">{L(lang, 'Expedition', 'Экспедиция')}</p>
          <div className="hm-exp-list" role="radiogroup" aria-label={L(lang, 'Expedition', 'Экспедиция')}>
            {EXPEDITIONS.map(exp => <button key={exp.mode} role="radio" aria-checked={mode === exp.mode} onClick={() => chooseMode(exp.mode)}>
              <MissionGlyph mode={exp.mode} />
              <span className="hm-exp-title">{L(lang, exp.en, exp.ru)}</span>
            </button>)}
          </div>

          <p className="hm-panel-label">{L(lang, 'Parameters', 'Параметры')}</p>
          <div className="hm-params">
            {PARAMS[mode].map(p => {
              const max = paramMax(p, params);
              const value = paramValue(p, params);
              return <label key={p.key} className="hm-param">
                <span className="hm-param-head"><span>{L(lang, p.en, p.ru)}</span><output>{value.toLocaleString(lang)}<small>{p.unit}</small></output></span>
                <input type="range" min={p.min} max={max} step={p.step} value={value} onChange={e => setParams(v => ({ ...v, [p.key]: Number(e.target.value) }))} style={{ '--fill': `${((value - p.min) / (max - p.min)) * 100}%` } as React.CSSProperties} />
              </label>;
            })}
          </div>

          <button className="eg-button hm-launch-button" onClick={() => startExpedition(true)}>{L(lang, 'Start simulation', 'Запустить моделирование')}<ArrowRight size={16} strokeWidth={1.6} /></button>
          <button className="hm-panel-link" onClick={() => startExpedition(false)}>{L(lang, 'Open the lab without running', 'Открыть лабораторию без запуска')}</button>
        </aside>
      </div>
      <a className="hm-scroll" href="#hm-thesis" aria-label={L(lang, 'Scroll to story', 'Прокрутить вниз')}><span /></a>
    </section>

    {/* 02 — Thesis */}
    <section id="hm-thesis" className="hm-thesis hm-wrap">
      <p className="eg-eyebrow" data-reveal>{L(lang, '01 / The problem', '01 / Задача')}</p>
      <h2 className="hm-statement" data-reveal>{L(lang,
        'Every crew that leaves Earth trains on it first. The hard question is where — and what that rehearsal can never prove.',
        'Каждый экипаж, покидающий Землю, сначала тренируется на ней. Сложный вопрос — где именно, и что такая репетиция никогда не докажет.')}</h2>
      <div className="hm-thesis-cols">
        <p data-reveal>{L(lang,
          `Egiz scores ${tiles.toLocaleString(lang)} candidate Earth sites against a mission's objectives on NASA-defined baselines, then searches for the smallest campaign — one, two or three sites — that covers the most.`,
          `Egiz оценивает ${tiles.toLocaleString(lang)} земных площадок-кандидатов по целям миссии на базовых линиях NASA и ищет минимальную кампанию — одну, две или три площадки, — которая покрывает больше всего.`)}</p>
        <p data-reveal>{L(lang,
          'Whatever no site on Earth can reproduce is written into a gap ledger, with the laboratory alternative that can.',
          'Всё, что не может воспроизвести ни одна площадка на Земле, вносится в реестр пробелов — вместе с лабораторной альтернативой.')}</p>
      </div>
      {synthetic && <p className="hm-note" data-reveal>{L(lang, 'Showing synthetic demo data — not NASA observations.', 'Показаны синтетические демо-данные — не наблюдения NASA.')}</p>}
    </section>

    {/* Film — the stand-in: the same light on another world */}
    <section className="hm-plate hm-plate-film hm-plate-scrub" aria-labelledby="hm-twin">
      <div className="hm-plate-media" aria-hidden="true"><Clip base="media/cinematic/earth/s2-twin" scrub /></div>
      <div className="hm-plate-copy hm-wrap">
        <p className="eg-eyebrow" data-reveal>{L(lang, 'The stand-in', 'Двойник')}</p>
        <h2 id="hm-twin" className="eg-display hm-h2" data-reveal>{L(lang, 'Same light. Another world.', 'Тот же свет. Другой мир.')}</h2>
        <p className="hm-body" data-reveal>{L(lang, 'The lunar plain turns into a desert salt pan. Crews rehearse here before they ever leave Earth.', 'Лунная равнина превращается в солончак пустыни. Здесь экипажи репетируют, прежде чем покинуть Землю.')}</p>
      </div>
      <span className="hm-veo" aria-hidden="true">{L(lang, 'Illustrative film · Veo', 'Иллюстрация · Veo')}</span>
    </section>

    {/* 03 — Moon target, measured */}
    {moon && <section className="hm-target hm-wrap" aria-labelledby="hm-moon">
      <figure className="hm-target-figure" data-reveal>
        <div className="hm-target-image">
          <img src={asset('hero/mons-mouton-hillshade-1600.jpg')} srcSet={`${asset('hero/mons-mouton-hillshade-800.jpg')} 800w, ${asset('hero/mons-mouton-hillshade-1600.jpg')} 1600w`} sizes="(max-width: 900px) 100vw, 50vw" width={1600} height={1600} alt={L(lang, 'Hillshade of the measured Mons Mouton terrain, 4 by 4 kilometres, lit by a low sun.', 'Теневая отмывка измеренного рельефа Монс-Мутон, 4 на 4 километра, при низком Солнце.')} loading="lazy" decoding="async" />
          <span className="hm-scale" aria-hidden="true"><i />1 km</span>
        </div>
        <figcaption className="eg-eyebrow">{L(lang, 'Measured, not illustrated — PGDA LOLA terrain, 10 m posts, 4 × 4 km', 'Измерено, а не нарисовано — рельеф PGDA LOLA, шаг 10 м, 4 × 4 км')}</figcaption>
      </figure>
      <div className="hm-target-copy">
        <p className="eg-eyebrow" data-reveal>{L(lang, '02 / Destination — Moon', '02 / Цель — Луна')}</p>
        <h2 id="hm-moon" className="eg-display hm-h2" data-reveal>Mons Mouton</h2>
        <p className="hm-body" data-reveal>{L(lang,
          'A mountain near the lunar south pole and a candidate Artemis region. The Sun never rises more than a few degrees; shadows run for kilometres.',
          'Гора у южного полюса Луны и район-кандидат программы Artemis. Солнце не поднимается выше нескольких градусов, тени тянутся на километры.')}</p>
        <dl className="hm-specs" data-reveal>
          <Spec label={L(lang, 'Position', 'Координаты')}>{latLon(lang, moon.lat, moon.lon)}</Spec>
          <Spec label={L(lang, 'Terrain', 'Рельеф')}>{moon.dem_product}</Spec>
          <Spec label={L(lang, 'Fine baseline', 'Малая база')}>{moon.fine_baseline_m} m</Spec>
          {moon.h_max_deg != null && <Spec label={L(lang, 'Max sun elevation', 'Макс. высота Солнца')}>{moon.h_max_deg.toFixed(1)}°</Spec>}
          {templateFor(moon) && <Spec label={L(lang, 'Objectives', 'Цели')}>{templateFor(moon)!.objectives.length}</Spec>}
        </dl>
        <button className="eg-button" data-reveal onClick={() => open('lab', moon)}>{L(lang, 'Explore the terrain', 'Изучить рельеф')}<ArrowRight size={16} strokeWidth={1.6} /></button>
      </div>
    </section>}

    {/* 04 — Mars target, full bleed */}
    {mars && <section className="hm-plate hm-plate-mars hm-plate-scrub" aria-labelledby="hm-mars">
      <div className="hm-plate-media" aria-hidden="true">
        <Clip base="media/cinematic/transitions/s4-passage" scrub />
      </div>
      <div className="hm-plate-copy hm-wrap">
        <p className="eg-eyebrow" data-reveal>{L(lang, '03 / Destination — Mars', '03 / Цель — Марс')}</p>
        <h2 id="hm-mars" className="eg-display hm-h2 hm-h2-xl" data-reveal>{L(lang, 'Jezero', 'Езеро')}</h2>
        <p className="hm-body" data-reveal>{L(lang,
          'An ancient lake delta and the Perseverance landing site — the reference for rover routes, field geology and sample work.',
          'Древняя дельта озера и место посадки Perseverance — эталон для маршрутов ровера, полевой геологии и работы с образцами.')}</p>
        <dl className="hm-specs hm-specs-row" data-reveal>
          <Spec label={L(lang, 'Position', 'Координаты')}>{latLon(lang, mars.lat, mars.lon)}</Spec>
          <Spec label={L(lang, 'Terrain', 'Рельеф')}>{mars.dem_product}</Spec>
          <Spec label={L(lang, 'Fine baseline', 'Малая база')}>{mars.fine_baseline_m} m</Spec>
        </dl>
        <button className="eg-button" data-reveal onClick={() => open('campaign', mars)}>{L(lang, 'Plan a Mars campaign', 'Спланировать кампанию')}<ArrowRight size={16} strokeWidth={1.6} /></button>
      </div>
    </section>}

    {/* Film — Mars becomes its Earth twin */}
    {mars && <section className="hm-plate hm-plate-film hm-plate-scrub" aria-labelledby="hm-mars-twin">
      <div className="hm-plate-media" aria-hidden="true"><Clip base="media/cinematic/missions/s6-answer" scrub /></div>
      <div className="hm-plate-copy hm-wrap">
        <p className="eg-eyebrow" data-reveal>{L(lang, 'The twin of Mars', 'Двойник Марса')}</p>
        <h2 id="hm-mars-twin" className="eg-display hm-h2" data-reveal>{L(lang, 'Mars has one too.', 'У Марса он тоже есть.')}</h2>
        {marsTwinName && <p className="hm-body" data-reveal>{L(lang, `The closest ground to Jezero on Earth: ${marsTwinName}.`, `Самый близкий к Езеро грунт на Земле — ${marsTwinName}.`)}</p>}
      </div>
      <span className="hm-veo" aria-hidden="true">{L(lang, 'Illustrative film · Veo', 'Иллюстрация · Veo')}</span>
    </section>}

    {/* 05 — Method & the live result */}
    <section className="hm-method hm-wrap" aria-labelledby="hm-method">
      <div className="hm-method-head">
        <p className="eg-eyebrow" data-reveal>{L(lang, '04 / Method', '04 / Метод')}</p>
        <h2 id="hm-method" className="eg-display hm-h2" data-reveal>{L(lang, 'Constrain. Compute. Confess.', 'Ограничить. Рассчитать. Признать.')}</h2>
      </div>
      <ol className="hm-steps">
        <li data-reveal><span className="hm-step-n">01</span><h3>{L(lang, 'Constrain', 'Ограничить')}</h3><p>{L(lang, 'Pick a mission template. Each objective names the terrain, light and thermal conditions it needs, on a fine and a 2 km baseline.', 'Выберите шаблон миссии. Каждая цель задаёт нужный рельеф, освещение и температуру — на малой базе и на базе 2 км.')}</p></li>
        <li data-reveal><span className="hm-step-n">02</span><h3>{L(lang, 'Compute', 'Рассчитать')}</h3><p>{L(lang, `Score ${tiles.toLocaleString(lang)} Earth tiles, then search exactly for the k = 1–3 site campaign with the highest coverage.`, `Оценить ${tiles.toLocaleString(lang)} земных участков и точно найти кампанию из k = 1–3 площадок с наибольшим покрытием.`)}</p></li>
        <li data-reveal><span className="hm-step-n">03</span><h3>{L(lang, 'Confess', 'Признать')}</h3><p>{L(lang, 'Report the ceiling Earth can reach for each objective, and list every condition that has to move to a lab.', 'Показать предел, которого Земля достигает по каждой цели, и перечислить всё, что придётся перенести в лабораторию.')}</p></li>
      </ol>
      <div className="hm-results">
        {[{ t: moon, c: moonCampaign }, { t: mars, c: marsCampaign }].filter(x => x.t && x.c).map(({ t, c }) => <article key={t!.id} className="hm-result" data-reveal>
          <header><p className="eg-eyebrow">{t!.body === 'moon' ? L(lang, 'Moon base', 'База на Луне') : L(lang, 'Mars surface', 'Поверхность Марса')} · k = {c!.k}</p><h3>{t!.name.split(/[/,]/)[0].trim()}</h3></header>
          <p className="hm-result-figure"><span className="eg-display">{pct(c!.coverage)}</span><span className="hm-result-unit">%<br />{L(lang, 'coverage', 'покрытие')}</span></p>
          <div className="hm-bar" aria-hidden="true"><i style={{ '--w': c!.coverage } as React.CSSProperties} /></div>
          <ul className="hm-sites">{c!.sites.map(s => <li key={s.id}>{tr(siteName(data, s.id))}</li>)}</ul>
        </article>)}
      </div>
      <p className="hm-footnote" data-reveal>{L(lang,
        `Results from the ${synthetic ? 'synthetic demo' : 'measured-terrain pilot'} dataset, engine ${data.results.engine_version}. Exploratory and unvalidated — the low lunar coverage is the finding, not an error.`,
        `Результаты набора данных «${synthetic ? 'синтетическое демо' : 'пилот на измеренном рельефе'}», движок ${data.results.engine_version}. Предварительно и без валидации — низкое покрытие для Луны и есть вывод, а не ошибка.`)}</p>
    </section>

    {/* 06 — What Earth cannot test */}
    {gapRows.length > 0 && <section className="hm-gaps hm-wrap" aria-labelledby="hm-gaps">
      <div className="hm-gaps-head">
        <p className="eg-eyebrow" data-reveal>{L(lang, '05 / Gap ledger', '05 / Реестр пробелов')}</p>
        <h2 id="hm-gaps" className="eg-display hm-h2" data-reveal>{L(lang, 'What Earth cannot test', 'Что Земля не может проверить')}</h2>
        <p className="hm-body" data-reveal>{L(lang, 'No analogue site closes these gaps. Egiz names each one and the facility that can.', 'Ни одна аналоговая площадка не закрывает эти пробелы. Egiz называет каждый — и установку, которая может.')}</p>
      </div>
      <ol className="hm-ledger">
        {gapRows.map((g, i) => <li key={g.gap} data-reveal>
          <span className="hm-ledger-n">{String(i + 1).padStart(2, '0')}</span>
          <strong>{tr(g.gap)}</strong>
          <span className="hm-ledger-alt">{tr(g.alternative)}</span>
        </li>)}
      </ol>
    </section>}

    {/* 07 — Earth */}
    <section className="hm-plate hm-plate-earth hm-plate-scrub" aria-labelledby="hm-earth">
      <div className="hm-plate-media" aria-hidden="true">
        <Clip base="media/cinematic/orbital/s7-home" scrub />
      </div>
      <div className="hm-plate-copy hm-plate-copy-top hm-wrap">
        <p className="eg-eyebrow" data-reveal>{L(lang, '06 / Built in Astana', '06 / Сделано в Астане')}</p>
        <h2 id="hm-earth" className="eg-display hm-h2 hm-h2-xl" data-reveal>{L(lang, <>Earth,<br />before elsewhere</>, <>Сначала Земля.<br />Затем космос</>)}</h2>
        <div className="hm-actions" data-reveal>
          <button className="eg-button" onClick={() => open('campaign')}>{L(lang, 'Design a campaign', 'Создать кампанию')}<ArrowRight size={16} strokeWidth={1.6} /></button>
        </div>
      </div>
    </section>

    {/* 08 — Index of workspaces */}
    <section className="hm-index hm-wrap" aria-labelledby="hm-index">
      <div className="hm-index-head">
        <p className="eg-eyebrow" data-reveal>{L(lang, '07 / Workspaces', '07 / Разделы')}</p>
        <h2 id="hm-index" className="eg-display hm-h2" data-reveal>{L(lang, 'The instrument', 'Инструмент')}</h2>
      </div>
      <ul className="hm-index-list">
        {tools.map((tool, i) => <li key={tool.route} data-reveal>
          <button onClick={() => open(tool.route)}>
            <span className="hm-index-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="hm-index-title">{L(lang, tool.title, tool.ru)}</span>
            <span className="hm-index-text">{L(lang, tool.text, tool.textRu)}</span>
            <ArrowUpRight className="hm-index-arrow" size={22} strokeWidth={1.4} aria-hidden="true" />
          </button>
        </li>)}
      </ul>
    </section>

    <footer className="hm-footer" data-spatial-footer>
      {/* the mark at the scale of a landscape: the sun setting behind the horizon */}
      <div className="hm-foot-scene" aria-hidden="true">
        <span className="hm-foot-sun" />
        <span className="hm-foot-orbit" />
      </div>
      <div className="hm-foot-line hm-wrap">
        <span className="hm-foot-word eg-display">Egiz</span>
        <button className="hm-foot-top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>{L(lang, 'Back to the Moon', 'Обратно к Луне')}<span aria-hidden="true">↑</span></button>
      </div>
      <div className="hm-foot-fine hm-wrap">
        <span>© 2026 Egiz</span>
        <span>{L(lang, 'Independent student project for NASA Space Apps Challenge 2026. Not affiliated with or endorsed by NASA.', 'Независимый студенческий проект для NASA Space Apps Challenge 2026. Не связан с NASA и не одобрен NASA.')}</span>
        <span>{L(lang, 'Films are illustrative, generated with Veo; terrain from NASA PGDA. Visual context only — never solver input.', 'Фильмы — иллюстрация, созданная в Veo; рельеф — NASA PGDA. Только визуальный контекст, не входные данные расчёта.')}</span>
        <button className="eg-button quiet" onClick={() => open('evidence')}><span>{L(lang, 'Sources & limits', 'Источники и ограничения')}</span></button>
      </div>
    </footer>
  </main>;
}
