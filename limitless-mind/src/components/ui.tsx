import { ButtonHTMLAttributes, ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { cx } from '../lib/util';

type BtnVariant = 'gold' | 'ghost' | 'outline' | 'danger' | 'subtle';
const btn: Record<BtnVariant, string> = {
  gold: 'bg-gold text-[#14120e] hover:brightness-110 font-medium',
  outline: 'border border-line hover:border-gold/60 text-ink',
  ghost: 'hover:bg-raised text-ink',
  subtle: 'bg-raised hover:bg-line/60 text-ink',
  danger: 'border border-bad/40 text-bad hover:bg-bad/10',
};
export function Button({ variant = 'gold', size = 'md', className, loading, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  return (
    <button {...p} disabled={p.disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed select-none',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2.5 text-sm', btn[variant], className)}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}{children}
    </button>
  );
}
export function LinkButton({ to, variant = 'outline', className, children, size = 'md' }: { to: string; variant?: BtnVariant; className?: string; children: ReactNode; size?: 'sm' | 'md' }) {
  return <Link to={to} className={cx('inline-flex items-center justify-center gap-2 rounded-xl transition', size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm', btn[variant], className)}>{children}</Link>;
}

export function Card({ className, children, as: As = 'div', ...p }: { className?: string; children: ReactNode; as?: 'div' | 'section' } & React.HTMLAttributes<HTMLDivElement>) {
  return <As {...p} className={cx('card p-5', className)}>{children}</As>;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3 fade-in">
      <div>
        {eyebrow && <div className="text-[11px] tracking-[0.25em] uppercase text-gold mb-1">{eyebrow}</div>}
        <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>
        {subtitle && <p className="text-muted mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-semibold">{children}</h2>{action}</div>;
}

export function Field({ label, hint, children, error }: { label: string; hint?: string; children: ReactNode; error?: string | null }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted/80">{hint}</span>}
      {error && <span className="block text-xs text-bad">{error}</span>}
    </label>
  );
}

export function Badge({ children, tone = 'muted', className }: { children: ReactNode; tone?: 'muted' | 'gold' | 'good' | 'bad'; className?: string }) {
  const t = { muted: 'bg-raised text-muted', gold: 'bg-gold/15 text-gold', good: 'bg-good/15 text-good', bad: 'bg-bad/15 text-bad' }[tone];
  return <span className={cx('inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full', t, className)}>{children}</span>;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={cx('h-1.5 bg-raised rounded-full overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-gradient-to-r from-goldsoft to-gold rounded-full transition-all duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4 border border-dashed border-line rounded-2xl">
      {icon && <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-raised grid place-items-center text-gold">{icon}</div>}
      <div className="font-medium">{title}</div>
      {text && <p className="text-sm text-muted mt-1 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className="flex items-center gap-2 text-muted text-sm py-6 justify-center" role="status"><Loader2 className="w-4 h-4 animate-spin" />{label}…</div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={cx('card w-full max-h-[92vh] overflow-auto rounded-b-none sm:rounded-2xl p-5 fade-in', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line mb-5" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cx('px-3.5 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition', value === t.id ? 'border-gold text-ink' : 'border-transparent text-muted hover:text-ink')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center justify-between w-full gap-4 py-2 text-left">
      <span className="text-sm">{label}</span>
      <span className={cx('w-10 h-6 rounded-full p-0.5 transition shrink-0', checked ? 'bg-gold' : 'bg-line')}>
        <span className={cx('block w-5 h-5 rounded-full bg-white shadow transition', checked && 'translate-x-4')} />
      </span>
    </button>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-display font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Notice({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'bad' | 'muted' }) {
  const t = { gold: 'border-gold/30 bg-gold/5', bad: 'border-bad/30 bg-bad/5 text-bad', muted: 'border-line bg-raised/50 text-muted' }[tone];
  return <div className={cx('border rounded-xl px-4 py-3 text-sm', t)}>{children}</div>;
}

/** Minimal, safe markdown: **bold**, _italic_, lists, quotes, hr, paragraphs. No raw HTML. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s: string, k: number) => {
    const parts = s.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
    return <span key={k}>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('_') && p.endsWith('_') && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p)}</span>;
  };
  return (
    <div className="prose-lm">
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (/^---+$/.test(b.trim())) return <hr key={i} />;
        if (lines.every((l) => /^\s*[-*] /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ''), j)}</li>)}</ul>;
        if (lines.every((l) => /^\s*\d+\. /.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+\. /, ''), j)}</li>)}</ol>;
        if (lines.every((l) => l.startsWith('>'))) return <blockquote key={i}>{lines.map((l, j) => <p key={j}>{inline(l.replace(/^>\s?/, ''), j)}</p>)}</blockquote>;
        if (/^#{1,3} /.test(b)) return <p key={i}><strong>{b.replace(/^#+ /, '')}</strong></p>;
        return <p key={i}>{lines.map((l, j) => <span key={j}>{inline(l, j)}{j < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}
