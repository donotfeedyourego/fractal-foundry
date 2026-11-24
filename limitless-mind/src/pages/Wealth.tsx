import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, Plus, Trash2, Download } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, Notice, PageHeader, SectionTitle, Tabs } from '../components/ui';
import { WEALTH_LESSONS, DISCLAIMER } from '../content/wealth';
import { useTable } from '../lib/hooks';
import { CURRENCIES, logActivity, money, usePrefs } from '../lib/prefs';
import { compoundSeries, margins, monthlyToTarget, revenueTarget, ruleOf72, salesTarget } from '../lib/finance';
import { cx, download, fmtDate, today } from '../lib/util';
import type { WealthRecord } from '../lib/types';

type Tab = 'learn' | 'calculators' | 'dashboard';
export default function Wealth() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'learn';
  return (
    <div>
      <PageHeader eyebrow="Wealth Lab" title="Financial intelligence, built patiently." subtitle="Wealth psychology, financial education, entrepreneurship, calculators and a private tracker." />
      <Tabs<Tab> value={tab} onChange={(t) => setSp({ tab: t })} tabs={[{ id: 'learn', label: 'Learn' }, { id: 'calculators', label: 'Calculators' }, { id: 'dashboard', label: 'Wealth dashboard' }]} />
      {tab === 'learn' && <Learn />}
      {tab === 'calculators' && <Calculators />}
      {tab === 'dashboard' && <Dashboard />}
      <div className="mt-8"><Notice tone="muted">{DISCLAIMER} This app never connects to bank accounts or makes transactions.</Notice></div>
    </div>
  );
}

function Learn() {
  const activity = useTable('activity_log');
  const [track, setTrack] = useState<'psychology' | 'education' | 'entrepreneurship'>('psychology');
  const [open, setOpen] = useState<string | null>(null);
  const done = new Set(activity.rows.filter((a) => a.kind === 'wealth_lesson').map((a) => a.ref));
  const list = WEALTH_LESSONS.filter((l) => l.track === track);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">{([['psychology', 'Wealth psychology'], ['education', 'Financial education'], ['entrepreneurship', 'Entrepreneurship']] as const).map(([id, l]) => <button key={id} onClick={() => setTrack(id)} className={cx('px-3 py-1.5 rounded-full text-sm border', track === id ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted')}>{l}</button>)}</div>
      <div className="grid md:grid-cols-2 gap-3">{list.map((l) => (
        <Card key={l.id} className={cx(done.has(l.id) && 'border-gold/40')}>
          <div className="flex justify-between items-start gap-2"><h3 className="text-xl">{l.title}</h3>{done.has(l.id) && <Badge tone="good"><Check className="w-3 h-3" />Done</Badge>}</div>
          <p className={cx('text-sm text-muted mt-2', open !== l.id && 'line-clamp-3')}>{l.body}</p>
          {open === l.id ? (
            <div className="mt-3 space-y-3 fade-in">
              <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-sm"><span className="text-gold">Action: </span>{l.action}</div>
              {l.reflect && <p className="text-sm text-muted">Reflect: {l.reflect}</p>}
              <div className="flex gap-2">{!done.has(l.id) && <Button size="sm" onClick={() => { logActivity('wealth_lesson', 5, l.id); logActivity('wealth_action', 0, l.id); }}>I completed the action</Button>}<Link to={`/journal/new?template=lesson&title=${encodeURIComponent(l.title)}`} className="text-sm text-gold self-center">Reflect in journal</Link></div>
            </div>
          ) : <button className="text-sm text-gold mt-3" onClick={() => setOpen(l.id)}>Read & act →</button>}
        </Card>))}</div>
    </div>
  );
}

const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
function NumField({ label, value, onChange, step = 1, suffix }: { label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string }) {
  return <Field label={label + (suffix ? ` (${suffix})` : '')}><input type="number" inputMode="decimal" min={0} step={step} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(num(e.target.value))} /></Field>;
}

function Calculators() {
  const { prefs } = usePrefs(); const cur = prefs.currency;
  const [c, setC] = useState({ p: 1000, m: 200, r: 6, y: 20 });
  const series = useMemo(() => compoundSeries(c.p, c.m, c.r, Math.min(60, c.y)), [c]);
  const last = series.at(-1)!;
  const [s, setS] = useState({ target: 10000, current: 500, r: 4, y: 3 });
  const monthly = monthlyToTarget(s.target, s.current, s.r, s.y);
  const [mg, setMg] = useState({ price: 50, cost: 20 });
  const mr = margins(mg.price, mg.cost);
  const [st, setSt] = useState({ fixed: 2000, price: 40, variable: 15, profit: 3000 });
  const sr = salesTarget(st.fixed, st.price, st.variable, st.profit);
  const [rt, setRt] = useState({ income: 50000, margin: 30, tax: 25 });
  const rr = revenueTarget(rt.income, rt.margin, rt.tax);
  const [ex, setEx] = useState<{ name: string; amount: number }[]>([{ name: 'Software', amount: 60 }, { name: 'Marketing', amount: 200 }]);
  const [exName, setExName] = useState(''); const [exAmt, setExAmt] = useState(0);
  const exTotal = ex.reduce((n, x) => n + x.amount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Compound growth</SectionTitle>
        <div className="grid sm:grid-cols-4 gap-3">
          <NumField label="Starting amount" suffix={CURRENCIES[cur]} value={c.p} onChange={(p) => setC({ ...c, p })} />
          <NumField label="Monthly contribution" suffix={CURRENCIES[cur]} value={c.m} onChange={(m) => setC({ ...c, m })} />
          <NumField label="Annual return" suffix="%" step={0.5} value={c.r} onChange={(r) => setC({ ...c, r: Math.min(30, r) })} />
          <NumField label="Years" value={c.y} onChange={(y) => setC({ ...c, y: Math.min(60, Math.max(1, Math.round(y))) })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="p-3 rounded-xl bg-raised/50"><div className="text-muted text-xs">Projected value</div><div className="text-2xl font-display text-gold">{money(last.value, cur)}</div></div>
          <div className="p-3 rounded-xl bg-raised/50"><div className="text-muted text-xs">You contribute</div><div className="text-2xl font-display">{money(last.contributed, cur)}</div></div>
          <div className="p-3 rounded-xl bg-raised/50"><div className="text-muted text-xs">Growth · Rule of 72</div><div className="text-2xl font-display">{money(last.value - last.contributed, cur)}</div><div className="text-xs text-muted">doubles every ~{ruleOf72(c.r).toFixed(1)} yrs</div></div>
        </div>
        <div className="h-64 mt-4">
          <ResponsiveContainer><AreaChart data={series}><CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" /><XAxis dataKey="year" stroke="rgb(var(--muted))" fontSize={11} /><YAxis stroke="rgb(var(--muted))" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
            <Tooltip formatter={(v: number) => money(v, cur)} contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12 }} />
            <Legend /><Area type="monotone" dataKey="contributed" name="Contributed" stroke="rgb(var(--muted))" fill="rgb(var(--muted) / .15)" /><Area type="monotone" dataKey="value" name="Value" stroke="rgb(var(--gold))" fill="rgb(var(--gold) / .2)" /></AreaChart></ResponsiveContainer>
        </div>
        <p className="text-xs text-muted mt-2">Assumes a constant return compounded monthly. Real returns vary year to year, can be negative, and are not guaranteed. Inflation and fees are not included.</p>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Monthly savings to a target</SectionTitle>
          <div className="grid grid-cols-2 gap-3"><NumField label="Target" suffix={CURRENCIES[cur]} value={s.target} onChange={(target) => setS({ ...s, target })} /><NumField label="Already saved" suffix={CURRENCIES[cur]} value={s.current} onChange={(current) => setS({ ...s, current })} /><NumField label="Annual interest" suffix="%" step={0.25} value={s.r} onChange={(r) => setS({ ...s, r: Math.min(30, r) })} /><NumField label="Years" step={0.5} value={s.y} onChange={(y) => setS({ ...s, y: Math.max(0.5, y) })} /></div>
          <div className="mt-4 text-lg">Save <span className="text-gold font-display text-2xl">{money(monthly, cur)}</span> per month</div>
        </Card>
        <Card>
          <SectionTitle>Profit margin</SectionTitle>
          <div className="grid grid-cols-2 gap-3"><NumField label="Selling price" suffix={CURRENCIES[cur]} value={mg.price} onChange={(price) => setMg({ ...mg, price })} /><NumField label="Cost per unit" suffix={CURRENCIES[cur]} value={mg.cost} onChange={(cost) => setMg({ ...mg, cost })} /></div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center"><div><div className="text-xs text-muted">Profit / unit</div><div className={cx('text-xl font-display', mr.profit < 0 && 'text-bad')}>{money(mr.profit, cur)}</div></div><div><div className="text-xs text-muted">Margin</div><div className="text-xl font-display text-gold">{mr.marginPct.toFixed(1)}%</div></div><div><div className="text-xs text-muted">Markup</div><div className="text-xl font-display">{mr.markupPct.toFixed(1)}%</div></div></div>
        </Card>
        <Card>
          <SectionTitle>Product sales target</SectionTitle>
          <div className="grid grid-cols-2 gap-3"><NumField label="Monthly fixed costs" suffix={CURRENCIES[cur]} value={st.fixed} onChange={(fixed) => setSt({ ...st, fixed })} /><NumField label="Price per unit" suffix={CURRENCIES[cur]} value={st.price} onChange={(price) => setSt({ ...st, price })} /><NumField label="Variable cost per unit" suffix={CURRENCIES[cur]} value={st.variable} onChange={(variable) => setSt({ ...st, variable })} /><NumField label="Profit goal" suffix={CURRENCIES[cur]} value={st.profit} onChange={(profit) => setSt({ ...st, profit })} /></div>
          {sr ? <div className="mt-4 text-sm space-y-1"><div>Break-even: <span className="text-gold">{sr.breakEvenUnits.toLocaleString()} units</span></div><div>To hit your goal: <span className="text-gold font-display text-xl">{sr.units.toLocaleString()} units</span> ({money(sr.revenue, cur)} revenue)</div><div className="text-muted">≈ {Math.ceil(sr.units / 30)} sales per day</div></div> : <Notice tone="bad">Price must be higher than variable cost per unit.</Notice>}
        </Card>
        <Card>
          <SectionTitle>Revenue target</SectionTitle>
          <div className="grid grid-cols-3 gap-3"><NumField label="Desired income" suffix={CURRENCIES[cur]} value={rt.income} onChange={(income) => setRt({ ...rt, income })} /><NumField label="Profit margin" suffix="%" value={rt.margin} onChange={(margin) => setRt({ ...rt, margin: Math.min(100, margin) })} /><NumField label="Tax rate" suffix="%" value={rt.tax} onChange={(tax) => setRt({ ...rt, tax: Math.min(99, tax) })} /></div>
          {rr ? <div className="mt-4">Annual revenue needed: <span className="text-gold font-display text-2xl">{money(rr, cur)}</span><div className="text-sm text-muted">{money(rr / 12, cur)} per month. Simplified: actual tax depends on your jurisdiction.</div></div> : <Notice tone="bad">Margin must be above 0%.</Notice>}
        </Card>
        <Card>
          <SectionTitle>Business expenses</SectionTitle>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (exName.trim()) { setEx([...ex, { name: exName.trim(), amount: exAmt }]); setExName(''); setExAmt(0); } }}><input value={exName} onChange={(e) => setExName(e.target.value)} placeholder="Expense" aria-label="Expense name" /><input type="number" min={0} value={exAmt || ''} onChange={(e) => setExAmt(num(e.target.value))} placeholder="Monthly" className="!w-28" aria-label="Amount" /><Button variant="outline"><Plus className="w-4 h-4" /></Button></form>
          <div className="mt-3 divide-y divide-line">{ex.map((x, i) => <div key={i} className="flex justify-between py-1.5 text-sm"><span>{x.name}</span><span className="flex gap-3">{money(x.amount, cur)}<button onClick={() => setEx(ex.filter((_, j) => j !== i))} className="text-muted hover:text-bad" aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></button></span></div>)}</div>
          <div className="flex justify-between mt-3 pt-3 border-t border-line"><span className="text-muted">Monthly / Annual</span><span className="font-display text-xl text-gold">{money(exTotal, cur)} / {money(exTotal * 12, cur)}</span></div>
        </Card>
        <CurrencyConverter />
      </div>
    </div>
  );
}

function CurrencyConverter() {
  const [amt, setAmt] = useState(100); const [from, setFrom] = useState('GBP'); const [to, setTo] = useState('USD');
  const [rate, setRate] = useState<{ v: number; date: string } | null>(null); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const codes = ['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'JPY', 'INR', 'ZAR', 'CHF', 'NZD', 'SGD'];
  useEffect(() => {
    if (from === to) { setRate({ v: 1, date: today() }); return; }
    const ctl = new AbortController(); setBusy(true); setErr(null);
    // Frankfurter: free, open-source API serving European Central Bank reference rates (github.com/hakanensari/frankfurter).
    fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setRate({ v: d.rates[to], date: d.date }))
      .catch((e) => { if (e.name !== 'AbortError') { setRate(null); setErr('Exchange rates are unavailable right now (offline or service down).'); } })
      .finally(() => setBusy(false));
    return () => ctl.abort();
  }, [from, to]);
  return (
    <Card>
      <SectionTitle>Currency conversion</SectionTitle>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2"><input type="number" min={0} value={amt} onChange={(e) => setAmt(num(e.target.value))} aria-label="Amount" /><select value={from} onChange={(e) => setFrom(e.target.value)} className="!w-24" aria-label="From">{codes.map((c) => <option key={c}>{c}</option>)}</select><select value={to} onChange={(e) => setTo(e.target.value)} className="!w-24" aria-label="To">{codes.map((c) => <option key={c}>{c}</option>)}</select></div>
      {err ? <div className="mt-3"><Notice tone="bad">{err}</Notice></div> : rate && <div className="mt-4"><div className="font-display text-2xl text-gold">{(amt * rate.v).toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}</div><div className="text-xs text-muted">1 {from} = {rate.v} {to} · ECB reference rate for {rate.date}{busy ? ' · updating…' : ''}. Indicative only.</div></div>}
    </Card>
  );
}

const KINDS: { id: WealthRecord['kind']; label: string }[] = [{ id: 'revenue', label: 'Revenue' }, { id: 'business_income', label: 'Business income' }, { id: 'expense', label: 'Expense' }, { id: 'saving', label: 'Saving' }, { id: 'target', label: 'Monthly target (net)' }];
function Dashboard() {
  const { prefs } = usePrefs(); const cur = prefs.currency;
  const rec = useTable('wealth_records'); const goals = useTable('goals');
  const [f, setF] = useState({ kind: 'expense' as WealthRecord['kind'], amount: '', category: '', note: '', record_date: today() });
  const [err, setErr] = useState<string | null>(null);
  const month = today().slice(0, 7);
  const add = async () => {
    const amount = Number(f.amount);
    if (!(amount > 0)) return setErr('Enter an amount greater than zero.');
    setErr(null);
    await rec.save({ kind: f.kind, amount, category: f.category.trim() || 'General', note: f.note.trim(), record_date: f.kind === 'target' ? month + '-01' : f.record_date });
    if (f.kind !== 'target') logActivity('wealth_record', 0, f.kind);
    setF({ ...f, amount: '', note: '' });
  };
  const months = useMemo(() => {
    const m: Record<string, { month: string; income: number; expense: number; saving: number }> = {};
    rec.rows.filter((r) => r.kind !== 'target').forEach((r) => {
      const k = r.record_date.slice(0, 7); m[k] ||= { month: k, income: 0, expense: 0, saving: 0 };
      if (r.kind === 'expense') m[k].expense += r.amount; else if (r.kind === 'saving') m[k].saving += r.amount; else m[k].income += r.amount;
    });
    return Object.values(m).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [rec.rows]);
  const cm = months.find((x) => x.month === month) || { income: 0, expense: 0, saving: 0 };
  const target = rec.rows.filter((r) => r.kind === 'target' && r.record_date.startsWith(month)).at(-1);
  const net = cm.income - cm.expense;
  const byCat = Object.entries(rec.rows.filter((r) => r.kind === 'expense' && r.record_date.startsWith(month)).reduce<Record<string, number>>((a, r) => { a[r.category] = (a[r.category] || 0) + r.amount; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const finGoals = goals.rows.filter((g) => g.category === 'Financial');
  const exportCsv = () => download('wealth-records.csv', 'date,kind,amount,category,note\n' + rec.rows.map((r) => [r.record_date, r.kind, r.amount, JSON.stringify(r.category), JSON.stringify(r.note)].join(',')).join('\n'), 'text/csv');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Income this month', cm.income], ['Expenses this month', cm.expense], ['Saved this month', cm.saving], ['Net cash flow', net]].map(([l, v]) => <div key={l as string} className="card p-4"><div className="text-xs text-muted">{l}</div><div className={cx('text-2xl font-display mt-1', (v as number) < 0 && 'text-bad')}>{money(v as number, cur)}</div></div>)}
      </div>
      {target && <Card className="p-4"><div className="flex justify-between text-sm"><span>Monthly net target</span><span>{money(net, cur)} / {money(target.amount, cur)}</span></div><div className="h-1.5 bg-raised rounded-full mt-2 overflow-hidden"><div className="h-full bg-gold" style={{ width: `${Math.max(0, Math.min(100, (net / target.amount) * 100))}%` }} /></div></Card>}
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
        <Card className="space-y-3">
          <SectionTitle>Add a record</SectionTitle>
          <div className="grid grid-cols-2 gap-2"><Field label="Type"><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as WealthRecord['kind'] })}>{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></Field><Field label={`Amount (${CURRENCIES[cur]})`} error={err}><input type="number" min={0} step="0.01" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field></div>
          {f.kind !== 'target' && <div className="grid grid-cols-2 gap-2"><Field label="Category"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="e.g. Rent, Client A" /></Field><Field label="Date"><input type="date" value={f.record_date} onChange={(e) => setF({ ...f, record_date: e.target.value })} /></Field></div>}
          <Field label="Note"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={140} /></Field>
          <Button onClick={add}><Plus className="w-4 h-4" />Add</Button>
          <p className="text-xs text-muted">Manual tracking only. Your figures are private to your account.</p>
        </Card>
        <Card>
          <SectionTitle action={rec.rows.length > 0 && <Button size="sm" variant="ghost" onClick={exportCsv}><Download className="w-4 h-4" />CSV</Button>}>Monthly overview</SectionTitle>
          {months.length ? <div className="h-64"><ResponsiveContainer><BarChart data={months}><CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="rgb(var(--muted))" fontSize={11} /><YAxis stroke="rgb(var(--muted))" fontSize={11} width={45} /><Tooltip formatter={(v: number) => money(v, cur)} contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12 }} /><Legend /><Bar dataKey="income" name="Income" fill="rgb(var(--gold))" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" name="Expenses" fill="rgb(var(--muted))" radius={[4, 4, 0, 0]} /><Bar dataKey="saving" name="Savings" fill="rgb(var(--good))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            : <Empty title="No records yet" text="Add your income and expenses to see your monthly picture." />}
          {byCat.length > 0 && <div className="mt-4"><div className="text-sm mb-2">This month’s expenses by category</div>{byCat.map(([k, v]) => <div key={k} className="flex justify-between text-sm py-0.5"><span className="text-muted">{k}</span><span>{money(v, cur)}</span></div>)}</div>}
        </Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card><SectionTitle>Recent records</SectionTitle>{rec.rows.length ? <div className="divide-y divide-line max-h-72 overflow-auto">{[...rec.rows].sort((a, b) => b.record_date.localeCompare(a.record_date)).slice(0, 30).map((r) => <div key={r.id} className="flex items-center gap-2 py-2 text-sm"><Badge tone={r.kind === 'expense' ? 'bad' : r.kind === 'saving' ? 'good' : 'gold'}>{KINDS.find((k) => k.id === r.kind)?.label}</Badge><span className="flex-1 truncate">{r.category}{r.note && <span className="text-muted"> · {r.note}</span>}</span><span className="text-muted text-xs">{fmtDate(r.record_date)}</span><span>{money(r.amount, cur)}</span><button onClick={() => rec.remove(r.id)} className="text-muted hover:text-bad" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div> : <p className="text-sm text-muted">Nothing recorded yet.</p>}</Card>
        <Card><SectionTitle action={<Link to="/goals?new=1&category=Financial" className="text-sm text-gold">New financial goal</Link>}>Financial goals</SectionTitle>{finGoals.length ? finGoals.map((g) => <Link key={g.id} to={`/goals/${g.id}`} className="block py-2 text-sm hover:text-gold">{g.title} <span className="text-muted">· {g.deadline ? fmtDate(g.deadline) : 'no deadline'}</span></Link>) : <p className="text-sm text-muted">Create goals in the Financial category to see them here.</p>}</Card>
      </div>
    </div>
  );
}
