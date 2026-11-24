import { useId } from 'react';

export function InfinityMark({ className = 'w-8 h-8', animated = false }: { className?: string; animated?: boolean }) {
  const gid = 'lmg' + useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0" stopColor="rgb(var(--goldsoft))" /><stop offset=".5" stopColor="rgb(var(--gold))" /><stop offset="1" stopColor="rgb(var(--goldsoft))" />
        </linearGradient>
      </defs>
      <path d="M32 16c-6-7.5-10.5-11-16-11a11 11 0 0 0 0 22c5.5 0 10-3.5 16-11s10.5-11 16-11a11 11 0 0 1 0 22c-5.5 0-10-3.5-16-11z"
        fill="none" stroke={`url(#${gid})`} strokeWidth="2.4" strokeLinecap="round"
        strokeDasharray={animated ? '140' : undefined} className={animated ? 'animate-[dash_6s_ease-in-out_infinite]' : undefined} />
      <style>{`@keyframes dash{0%{stroke-dashoffset:140}50%{stroke-dashoffset:0}100%{stroke-dashoffset:-140}}`}</style>
    </svg>
  );
}
export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <InfinityMark className="w-9 h-5" />
      {!compact && <div className="leading-none"><div className="text-[10px] tracking-[0.3em] text-muted">THE</div><div className="font-display text-lg font-semibold tracking-[0.08em]">LIMITLESS MIND</div></div>}
    </div>
  );
}
