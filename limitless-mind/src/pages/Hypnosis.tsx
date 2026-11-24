import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Play, Plus, Sparkles, Trash2, Volume2, Check } from 'lucide-react';
import { CATEGORIES, PROGRAMMES } from '../content/hypnosis';
import { useTable } from '../lib/hooks';
import { Badge, Button, Card, Empty, LinkButton, Notice, PageHeader, Tabs } from '../components/ui';
import { AudioLibrary } from '../components/AudioLibrary';
import { cx } from '../lib/util';
import { ScriptSpeaker, segment, ttsSupported } from '../lib/tts';

export const SAFETY = 'These sessions are guided relaxation and self-development exercises. They are not a substitute for professional medical or psychological treatment and do not guarantee results. Do not listen while driving or operating machinery. If you have epilepsy, a psychotic disorder or serious mental health concerns, consult a professional first.';

type Tab = 'programmes' | 'mine' | 'affirmations' | 'audio';

export default function Hypnosis() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'programmes';
  return (
    <div>
      <PageHeader eyebrow="Hypnosis Studio" title="Guide your attention. Shape your habits." subtitle="Guided sessions, self-hypnosis scripts, affirmations and your own recordings."
        actions={<LinkButton to="/hypnosis/generate" variant="gold"><Sparkles className="w-4 h-4" />Create personal session</LinkButton>} />
      <Tabs<Tab> value={tab} onChange={(t) => setSp({ tab: t })} tabs={[{ id: 'programmes', label: 'Programmes' }, { id: 'mine', label: 'My sessions' }, { id: 'affirmations', label: 'Affirmations' }, { id: 'audio', label: 'Audio library' }]} />
      {tab === 'programmes' && <Programmes />}
      {tab === 'mine' && <MySessions />}
      {tab === 'affirmations' && <Affirmations />}
      {tab === 'audio' && <AudioLibrary />}
      <div className="mt-8"><Notice tone="muted">{SAFETY}</Notice></div>
    </div>
  );
}

function Programmes() {
  const progress = useTable('session_progress');
  const [cat, setCat] = useState('All');
  const [favOnly, setFavOnly] = useState(false);
  const p = (id: string) => progress.rows.find((r) => r.session_id === id);
  const list = PROGRAMMES.filter((x) => (cat === 'All' || x.category === cat) && (!favOnly || p(x.id)?.favourite));
  const [first, ...rest] = list;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['All', ...CATEGORIES].map((c) => <button key={c} onClick={() => setCat(c)} className={cx('px-3 py-1.5 rounded-full text-xs whitespace-nowrap border', cat === c ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted')}>{c}</button>)}
        <button onClick={() => setFavOnly(!favOnly)} className={cx('px-3 py-1.5 rounded-full text-xs whitespace-nowrap border flex items-center gap-1', favOnly ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted')}><Heart className="w-3 h-3" />Favourites</button>
      </div>
      {!list.length && <Empty title="Nothing here yet" text="Mark sessions as favourites with the heart icon." />}
      {first && first.id === 'lm-001' && (
        <Link to={`/hypnosis/session/${first.id}`} className="block card p-6 md:p-8 relative overflow-hidden hover:border-gold/50 transition">
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
          <Badge tone="gold">{first.subtitle}</Badge>
          <h2 className="text-3xl md:text-4xl mt-3">{first.title}</h2>
          <p className="text-muted mt-2 max-w-2xl">{first.objective}</p>
          <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted">{first.chapters.map((c) => <span key={c.title} className="px-2 py-1 rounded-md bg-raised">{c.title}</span>)}</div>
          <div className="mt-5 inline-flex items-center gap-2 text-gold text-sm"><Play className="w-4 h-4" />{first.minutes} min · {p(first.id)?.completed_count ? `Completed ${p(first.id)!.completed_count}×` : 'Begin'}</div>
        </Link>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(first?.id === 'lm-001' ? rest : list).map((x) => {
          const pr = p(x.id);
          return (
            <Link key={x.id} to={`/hypnosis/session/${x.id}`} className="card p-5 hover:border-gold/50 transition group">
              <div className="flex justify-between items-start"><Badge>{x.category}</Badge>{pr?.favourite && <Heart className="w-4 h-4 text-gold fill-gold" />}</div>
              <h3 className="text-xl mt-3 group-hover:text-gold transition">{x.title}</h3>
              <p className="text-sm text-muted mt-1 line-clamp-2">{x.objective}</p>
              <div className="flex items-center gap-3 mt-4 text-xs text-muted">
                <span>{x.minutes} min</span>
                {pr?.completed_count ? <span className="text-good flex items-center gap-1"><Check className="w-3 h-3" />{pr.completed_count}×</span> : pr?.char_index ? <span className="text-gold">In progress</span> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MySessions() {
  const s = useTable('hypnosis_sessions');
  if (!s.rows.length) return <Empty icon={<Sparkles className="w-5 h-5" />} title="No personal sessions yet" text="Generate one from your own goals, or open any programme and choose “Edit a personal copy”." action={<LinkButton to="/hypnosis/generate" variant="gold" size="sm">Create personal session</LinkButton>} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[...s.rows].reverse().map((x) => (
        <Card key={x.id} className="flex flex-col">
          <div className="flex justify-between"><Badge tone="gold">{x.source === 'edited_copy' ? 'Edited copy' : x.source === 'generated' ? 'AI generated' : x.source === 'template' ? 'Personal template' : 'Custom'}</Badge>
            <button onClick={() => confirm('Delete this session?') && s.remove(x.id)} className="text-muted hover:text-bad" aria-label="Delete"><Trash2 className="w-4 h-4" /></button></div>
          <Link to={`/hypnosis/session/${x.id}`} className="text-xl mt-3 hover:text-gold">{x.title}</Link>
          <p className="text-sm text-muted mt-1 line-clamp-2 flex-1">{x.objective}</p>
          <LinkButton to={`/hypnosis/session/${x.id}`} size="sm" className="mt-4 self-start"><Play className="w-3.5 h-3.5" />Open</LinkButton>
        </Card>
      ))}
    </div>
  );
}

const speaker = new ScriptSpeaker();
function Affirmations() {
  const a = useTable('affirmations');
  const [text, setText] = useState(''); const [cat, setCat] = useState('General');
  const [speaking, setSpeaking] = useState(false);
  const add = async () => { if (!text.trim()) return; await a.save({ text: text.trim(), category: cat, pinned: false }); setText(''); };
  const speakAll = () => {
    if (speaking) { speaker.stop(); setSpeaking(false); return; }
    const list = [...a.rows].sort((x, y) => Number(y.pinned) - Number(x.pinned));
    speaker.load(segment([{ text: list.map((x) => x.text.replace(/[.!?]?$/, '.') + ' [pause]').join('\n') }]));
    speaker.rate = 0.85; speaker.onEnd = () => setSpeaking(false); speaker.play(); setSpeaking(true);
  };
  const suggestions = ['I learn something valuable every day.', 'I make money decisions with patience and clarity.', 'I start before I feel ready.', 'I keep the promises I make to myself.', 'I am building a life by design.'];
  return (
    <div className="grid md:grid-cols-[1fr_1.4fr] gap-4">
      <Card className="space-y-3">
        <h3 className="text-xl">Write an affirmation</h3>
        <p className="text-sm text-muted">Effective affirmations are present tense, specific and believable. Pair them with action.</p>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="I am someone who…" maxLength={240} />
        <div className="flex gap-2"><select value={cat} onChange={(e) => setCat(e.target.value)}>{['General', 'Wealth', 'Learning', 'Discipline', 'Confidence', 'Creativity'].map((c) => <option key={c}>{c}</option>)}</select><Button onClick={add} disabled={!text.trim()}><Plus className="w-4 h-4" />Save</Button></div>
        <div className="pt-3 border-t border-line"><div className="text-xs text-muted mb-2">Suggestions</div>{suggestions.map((s) => <button key={s} onClick={() => setText(s)} className="block text-left text-sm text-muted hover:text-gold py-1">+ {s}</button>)}</div>
      </Card>
      <Card>
        <div className="flex justify-between items-center mb-3"><h3 className="text-xl">Your affirmations</h3>{a.rows.length > 0 && ttsSupported() && <Button size="sm" variant="outline" onClick={speakAll}><Volume2 className="w-4 h-4" />{speaking ? 'Stop' : 'Listen to all'}</Button>}</div>
        {a.rows.length ? <ul className="space-y-2">{[...a.rows].sort((x, y) => Number(y.pinned) - Number(x.pinned)).map((x) => (
          <li key={x.id} className="flex items-start gap-3 p-3 rounded-xl bg-raised/50">
            <button onClick={() => a.save({ id: x.id, pinned: !x.pinned })} aria-label="Pin"><Heart className={cx('w-4 h-4 mt-0.5', x.pinned ? 'text-gold fill-gold' : 'text-muted')} /></button>
            <div className="flex-1"><div className="font-display text-lg leading-snug">{x.text}</div><div className="text-xs text-muted">{x.category}</div></div>
            <button onClick={() => a.remove(x.id)} className="text-muted hover:text-bad" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
          </li>))}</ul> : <Empty title="No affirmations yet" text="Write your first one, or pick a suggestion." />}
      </Card>
    </div>
  );
}
