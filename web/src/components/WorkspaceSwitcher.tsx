// EGIZ · the index, folded into one control for full-screen workspaces (Planetary Studio, Mission Studio) that
// draw their own top bar: the mission chip, then every workspace in the same order and words as the site header.
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { t } from '../i18n';
import { useAppStore } from '../state/store';
import { contextNote, openWorkspace, WORKSPACES } from '../expedition/nav';
import { MissionChip } from './SiteHeader';

export function WorkspaceSwitcher() {
  const route = useAppStore(a => a.route), [open, setOpen] = useState(false), box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }, esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return <div className="eg-switch" ref={box}>
    <MissionChip />
    <button className="eg-switch-toggle" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>{t('Workspaces')}<ChevronDown size={13} /></button>
    {open && <div className="eg-switch-menu" role="menu">
      {WORKSPACES.map((w, i) => <button key={w.route} role="menuitem" aria-current={route === w.route ? 'page' : undefined} onClick={() => { setOpen(false); openWorkspace(w.route); }}>
        <span className="eg-switch-n">{String(i + 1).padStart(2, '0')}</span><b>{t(w.title)}</b><em>{t(contextNote(w.route) ?? w.text)}</em></button>)}
    </div>}
  </div>;
}
