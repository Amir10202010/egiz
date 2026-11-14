// One clip, scrubbed by the scroll, with a single line of type: used for the finale.
// AI-assisted implementation; human review pending.
import { useEffect, useRef, useState } from 'react';
import { prefersStills, type CinemaAsset } from '../cinema/cinema';
import { Decode } from './Decode';

export function ScrubScene({ clip, lang, nav, kicker, title }: { clip: CinemaAsset; lang: 'en' | 'ru'; nav: string; kicker: string; title: string }) {
  const root = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const stills = useRef(prefersStills());
  useEffect(() => {
    const host = root.current; if (!host) return;
    let raf = 0, live = false, sp = 0, last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const r = host.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      sp += (p - sp) * (1 - Math.exp(-dt * 9));
      const v = vid.current;
      if (v && v.readyState >= 1 && v.duration) { const t = sp * (v.duration - .05); if (Math.abs(v.currentTime - t) > 1 / 48) v.currentTime = t; }
      host.style.setProperty('--sc', sp.toFixed(4));
      const show = sp > .55; setOn(o => o === show ? o : show);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !live) { live = true; if (vid.current && vid.current.preload !== 'auto') { vid.current.preload = 'auto'; vid.current.load(); } last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!e.isIntersecting && live) { live = false; cancelAnimationFrame(raf); }
    }, { rootMargin: '60% 0px' });
    io.observe(host);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <section ref={root} className="lx-scrub" data-nav={nav} data-nav-look="lx-scrub-focus">
    <div className="lx-scrub-stage">
      {clip.sources.length && !stills.current
        ? <video ref={vid} muted playsInline preload="none" poster={clip.still ?? undefined} style={{ objectPosition: clip.focus }}>{clip.sources.map(s => <source key={s.src} src={s.src} type={s.type} />)}</video>
        : <img src={clip.end ?? clip.still ?? ''} alt="" style={{ objectPosition: clip.focus }} />}
      <div className="lx-scrub-shade" aria-hidden="true" />
      <span id="lx-scrub-focus" className="lx-scrub-focus" aria-hidden="true" />
      <div className={`lx-scrub-cap ${on ? 'is-on' : ''}`}>
        <p className="lx-eyebrow">{kicker}</p>
        <Decode as="h2" className="lx-h lx-h-xl" text={title} on={on} speed={22} />
      </div>
      <span className="lx-credit">{clip.id} · {lang === 'ru' ? 'иллюстративный кадр' : 'illustrative film'}</span>
    </div>
  </section>;
}
