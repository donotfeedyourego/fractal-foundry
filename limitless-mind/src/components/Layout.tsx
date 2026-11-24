import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Waves, Brain, GraduationCap, Landmark, NotebookPen, Target, Sparkles, LineChart, Settings, PanelLeftClose, PanelLeftOpen, Menu, X, Sun } from 'lucide-react';
import { Wordmark } from './Logo';
import { cx } from '../lib/util';
import { MiniPlayer } from './Player';
import { useLocalState } from '../lib/hooks';
import { useAuth } from '../context/Auth';

export const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/hypnosis', label: 'Hypnosis Studio', icon: Waves },
  { to: '/mind', label: 'Mind Training', icon: Brain },
  { to: '/academy', label: 'Knowledge Academy', icon: GraduationCap },
  { to: '/wealth', label: 'Wealth Lab', icon: Landmark },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/goals', label: 'Goals & Execution', icon: Target },
  { to: '/mentor', label: 'AI Mentor', icon: Sparkles },
  { to: '/routine', label: 'Daily Routine', icon: Sun },
  { to: '/progress', label: 'My Progress', icon: LineChart },
  { to: '/settings', label: 'Profile & Settings', icon: Settings },
];
const BOTTOM = ['/', '/hypnosis', '/academy', '/goals'];

export function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useLocalState('lm.sidebar', false);
  const [more, setMore] = useState(false);
  const loc = useLocation();
  const { mode } = useAuth();
  const active = (to: string) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);

  return (
    <div className="min-h-screen md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-gold text-black px-3 py-2 rounded">Skip to content</a>
      {/* Desktop sidebar */}
      <aside className={cx('hidden md:flex flex-col shrink-0 sticky top-0 h-screen border-r border-line bg-surface/60 backdrop-blur transition-all', collapsed ? 'w-[72px]' : 'w-64')}>
        <div className="flex items-center justify-between px-4 h-16">
          <Wordmark compact={collapsed} />
          {!collapsed && <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-raised text-muted" aria-label="Collapse sidebar"><PanelLeftClose className="w-4 h-4" /></button>}
        </div>
        {collapsed && <button onClick={() => setCollapsed(false)} className="mx-auto mb-2 p-1.5 rounded-lg hover:bg-raised text-muted" aria-label="Expand sidebar"><PanelLeftOpen className="w-4 h-4" /></button>}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} title={n.label}
              className={cx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition', active(n.to) ? 'bg-raised text-ink' : 'text-muted hover:text-ink hover:bg-raised/60', collapsed && 'justify-center')}>
              <n.icon className={cx('w-[18px] h-[18px] shrink-0', active(n.to) && 'text-gold')} />
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>
        {!collapsed && <div className="p-4 text-[11px] text-muted border-t border-line">{mode === 'cloud' ? 'Synced to your account' : 'Local mode · data stays on this device'}</div>}
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-bg/85 backdrop-blur border-b border-line">
          <Wordmark />
        </div>
        <main id="main" className="px-4 md:px-8 lg:px-12 pt-6 pb-40 md:pb-28 max-w-6xl mx-auto">{children}</main>
      </div>

      <MiniPlayer />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line safe-bottom" aria-label="Primary">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => BOTTOM.includes(n.to)).map((n) => (
            <NavLink key={n.to} to={n.to} className={cx('flex flex-col items-center gap-1 py-2.5 text-[10px]', active(n.to) ? 'text-gold' : 'text-muted')}>
              <n.icon className="w-5 h-5" />{n.label.split(' ')[0]}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted" aria-label="More sections"><Menu className="w-5 h-5" />More</button>
        </div>
      </nav>
      {more && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMore(false)}>
          <div className="absolute bottom-0 inset-x-0 card rounded-b-none p-4 safe-bottom fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><span className="font-display text-xl">All sections</span><button onClick={() => setMore(false)} aria-label="Close"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-3 gap-2">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} onClick={() => setMore(false)} className={cx('flex flex-col items-center gap-2 p-3 rounded-xl text-[11px] text-center', active(n.to) ? 'bg-raised text-gold' : 'text-muted bg-raised/40')}>
                  <n.icon className="w-5 h-5" />{n.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
