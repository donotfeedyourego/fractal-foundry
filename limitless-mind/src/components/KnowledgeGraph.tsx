import { useEffect, useMemo, useRef, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { SUBJECTS } from '../content/academy';
import { LINKS } from '../content/connections';
import { cx } from '../lib/util';

interface N extends SimulationNodeDatum { id: string; label: string }
interface E extends SimulationLinkDatum<N> { how: string }

export function KnowledgeGraph({ selected, onSelect, progress }: { selected: string | null; onSelect: (id: string | null) => void; progress: Record<string, number> }) {
  const W = 800, H = 560;
  const { nodes, edges } = useMemo(() => {
    const nodes: N[] = SUBJECTS.map((s) => ({ id: s.id, label: s.name }));
    const edges: E[] = LINKS.map((l) => ({ source: l.a, target: l.b, how: l.how }));
    const sim = forceSimulation(nodes)
      .force('link', forceLink<N, E>(edges).id((d) => d.id).distance(110).strength(0.5))
      .force('charge', forceManyBody().strength(-420))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide(42))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    // Fit the settled layout to the canvas (leave room for labels).
    const xs = nodes.map((n) => n.x!), ys = nodes.map((n) => n.y!);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    nodes.forEach((n) => { n.x = 70 + ((n.x! - x0) / (x1 - x0 || 1)) * (W - 140); n.y = 40 + ((n.y! - y0) / (y1 - y0 || 1)) * (H - 100); });
    return { nodes, edges };
  }, []);
  const [hover, setHover] = useState<string | null>(null);
  const focus = hover || selected;
  const neighbours = useMemo(() => {
    if (!focus) return null;
    const s = new Set([focus]);
    edges.forEach((e) => { const a = (e.source as N).id, b = (e.target as N).id; if (a === focus) s.add(b); if (b === focus) s.add(a); });
    return s;
  }, [focus, edges]);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onSelect(null); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onSelect]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Knowledge graph of how subjects connect">
      {edges.map((e, i) => {
        const a = e.source as N, b = e.target as N;
        const on = neighbours ? neighbours.has(a.id) && neighbours.has(b.id) && (a.id === focus || b.id === focus) : false;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? 'rgb(var(--gold))' : 'rgb(var(--line))'} strokeWidth={on ? 1.8 : 1} opacity={neighbours && !on ? 0.25 : 0.9} />;
      })}
      {nodes.map((n) => {
        const dim = neighbours && !neighbours.has(n.id);
        const pct = progress[n.id] || 0;
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`} className="cursor-pointer outline-none" opacity={dim ? 0.3 : 1}
            onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)} onClick={() => onSelect(selected === n.id ? null : n.id)}
            tabIndex={0} role="button" aria-label={n.label} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(n.id)}>
            <circle r={20} fill="rgb(var(--surface))" stroke={n.id === focus ? 'rgb(var(--gold))' : 'rgb(var(--line))'} strokeWidth={n.id === focus ? 2 : 1.2} />
            {pct > 0 && <circle r={20} fill="none" stroke="rgb(var(--gold))" strokeWidth={2.5} strokeDasharray={`${(pct / 100) * 125.6} 125.6`} transform="rotate(-90)" />}
            <circle r={4} fill="rgb(var(--gold))" opacity={0.8} />
            <text y={34} textAnchor="middle" className={cx('text-[11px]', n.id === focus ? 'fill-[rgb(var(--ink))]' : 'fill-[rgb(var(--muted))]')} style={{ fontFamily: 'Inter, sans-serif' }}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
