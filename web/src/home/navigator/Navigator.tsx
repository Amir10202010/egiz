// The guide that travels with you from the first frame to the footer. Each section says where it
// should be ("data-nav": x y scale floor, in viewport fractions) and what it should point at
// ("data-nav-look": an element id). The object flies between those poses on its own physics.
// Loaded lazily; a still of the same angle stands in until WebGL is ready, or if it never is.
// AI-assisted implementation; human review pending.
import { useEffect, useRef, useState } from 'react';
import './navigator.css';

function webgl() {
  try { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); if (!gl) return false; gl.getExtension('WEBGL_lose_context')?.loseContext(); return true; } catch { return false; }
}

function readPose() {
  const vh = window.innerHeight; const mid = vh * .5;
  let best: HTMLElement | null = null;
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach(el => { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) best = el; });
  if (!best) return null;
  const el = best as HTMLElement;
  // narrow screens may give their own pose (data-nav-m): words take the width there
  const spec = (window.innerWidth < 900 && el.dataset.navM) || el.dataset.nav || '';
  const [x, y, s, floor] = spec.split(/\s+/).map(Number);
  let look: { x: number; y: number } | null = null;
  const id = el.dataset.navLook; const target = id ? document.getElementById(id) : null;
  if (target) { const r = target.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < vh) look = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / vh }; }
  return { pose: { x: x ?? .7, y: y ?? .5, s: s ?? 1, floor: floor ?? 0 }, look, hidden: el.dataset.navHide === 'true' };
}

export function Navigator() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'live' | 'still'>('loading');

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    if (!webgl()) { setState('still'); return; }
    let raf = 0, alive = true, last = performance.now();
    let scene: import('./scene').NavigatorScene | null = null;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const compact = Math.min(window.innerWidth, window.innerHeight) < 600 || (window.matchMedia?.('(pointer: coarse)').matches ?? false);
    const move = (e: PointerEvent) => scene?.setPointer(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    const resize = () => scene?.resize();
    const start = async () => {
      // a failed download or a GPU that refuses the context both fall back to the still
      try { const { NavigatorScene } = await import('./scene'); if (!alive) return; scene = new NavigatorScene(cv, { compact, reduced }); } catch { if (alive) setState('still'); return; }
      setState('live');
      if (import.meta.env.DEV) (window as unknown as { __nav: unknown }).__nav = scene;   // for rendering the still fallback
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        const p = readPose();
        if (p) { scene!.setPose(p.pose); scene!.setLook(p.look); cv.dataset.hidden = String(p.hidden); }
        scene!.frame(dt);
      };
      raf = requestAnimationFrame(loop);
    };
    // after first paint, when the browser is idle: the film comes first
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const kick = idle ? idle(() => void start(), { timeout: 1500 }) : window.setTimeout(() => void start(), 600);
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('resize', resize);
    return () => { alive = false; cancelAnimationFrame(raf); if (!idle) window.clearTimeout(kick as number); window.removeEventListener('pointermove', move); window.removeEventListener('resize', resize); scene?.dispose(); };
  }, []);

  return <div className="nv" data-state={state} aria-hidden="true">
    <canvas ref={canvas} className="nv-canvas" />
    {state === 'still' && <img className="nv-still" src={`${import.meta.env.BASE_URL}media/navigator/navigator.png`} alt="" />}
  </div>;
}
