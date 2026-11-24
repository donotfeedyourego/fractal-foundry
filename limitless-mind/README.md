# The Limitless Mind

**Train Your Mind. Expand Your Knowledge. Build Your Wealth. Execute Your Vision.**

A personal development operating system: guided self-hypnosis, mind training, a 20-department
knowledge academy, a wealth lab, journaling, goals and execution, an AI mentor ("The Architect"),
a daily routine and progress analytics.

- **Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase (Auth, Postgres + RLS, Storage, Edge Functions) · Recharts
- **Works immediately** in *Local mode* (no backend, data stays in the browser). Add Supabase for accounts and sync, and an API key for real AI.

---

## Open-source projects this is built on

| Project | Used for |
|---|---|
| [supabase/supabase](https://github.com/supabase/supabase) + [supabase-js](https://github.com/supabase/supabase-js) | Auth, Postgres with Row Level Security, private Storage, Edge Functions |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | FSRS spaced-repetition scheduler for flashcards (Mind Training → Memory) |
| [d3/d3-force](https://github.com/d3/d3-force) | Layout for the *Connect the Knowledge* graph |
| [recharts/recharts](https://github.com/recharts/recharts) | Progress, compound-growth and wealth charts |
| [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | Icons |
| [remix-run/react-router](https://github.com/remix-run/react-router) | Routing (hash router: works on any static host) |
| [hakanensari/frankfurter](https://github.com/hakanensari/frankfurter) | Free ECB exchange-rate API for the currency converter |
| [anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript) | Server-side Claude calls inside the `architect` Edge Function |

Ambient soundscapes are synthesised live with the Web Audio API (approach similar to
[NoiseGenJS](https://github.com/ichabodcole/NoiseGenJS)); no audio files are bundled.

---

## Quick start (Local mode)

```bash
cd limitless-mind
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (finance maths, content integrity, SRS/AI fallbacks)
npm run build      # production build → dist/
```

Choose **Continue on this device only**. Everything works except cross-device sync and real AI;
AI features fall back to a clearly labelled demo mode.

## Cloud mode: Supabase setup

1. Create a project at supabase.com.
2. **Database:** open *SQL Editor* and run `supabase/migrations/0001_init.sql`
   (or `supabase link --project-ref <ref> && supabase db push`). It creates all 20 tables
   (`profiles`, `user_preferences`, `hypnosis_sessions`, `session_progress`, `journal_entries`,
   `affirmations`, `learning_subjects`, `learning_modules`, `learning_progress`, `flashcards`,
   `quiz_results`, `goals`, `milestones`, `tasks`, `habits`, `wealth_records`, `ai_conversations`,
   `ai_messages`, `saved_resources`, plus `activity_log` and `recordings`), owner-only RLS policies on
   every table, a private `recordings` storage bucket with per-user folder policies, and a
   `delete_my_account()` function.
3. **Auth:** *Authentication → URL Configuration* → add your site URL to *Redirect URLs*
   (for email confirmation and magic links).
4. **Frontend env:** copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (both public; RLS protects the data). Rebuild.

### AI: The Architect (optional)

```bash
supabase functions deploy architect
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # never put this in the frontend
# optional: supabase secrets set ARCHITECT_MODEL=claude-opus-5-5
```

The function verifies the caller's Supabase session, keeps the key server-side, uses Claude Opus 5.5
with server-side refusal fallbacks enabled, and returns `{"error":"not_configured"}` when no key is
set. The app then shows demo mode instead of pretending. Use **Settings → Test AI connection** to check.

### External text-to-speech (optional)

Browser speech works out of the box. To generate **downloadable** audio files:

```bash
supabase functions deploy tts
supabase secrets set TTS_PROVIDER=elevenlabs ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=...
# or: supabase secrets set TTS_PROVIDER=openai OPENAI_API_KEY=...
```

Generated files are saved to the Audio library labelled **Generated (external TTS)**, separate from
**Your voice** and **Uploaded file**.

## Deployment

It's a static site after `npm run build`; deploy `dist/` anywhere.

- **GitHub Pages (this repo):** `npm run build:pages` writes the build to `../limitless/`. Commit it,
  and with Pages serving the repository root it is live at `https://<user>.github.io/fractal-foundry/limitless/`.
  (Supabase env vars must be present at build time if you want cloud mode there.)
- **Netlify / Vercel:** build command `npm run build`, publish directory `dist`, root `limitless-mind`,
  and set the two `VITE_SUPABASE_*` environment variables.

## Project structure

```
src/
  content/     Original content: hypnosis programmes, academy (60 lessons), wealth, mind training,
               journal templates, 30/90-day programmes, knowledge links, session generator
  lib/         store (local + Supabase backends), ai (+ honest demo), tts, ambient audio, player,
               media storage, FSRS, finance maths, hooks
  components/  UI kit, layout (sidebar + mobile bottom nav), player, audio library, knowledge graph
  pages/       Home, Hypnosis, Session, Generator, Mind, Academy, Wealth, Journal, Goals, Mentor,
               Progress, Routine, Settings, Auth, Onboarding
supabase/
  migrations/0001_init.sql   schema + RLS + storage policies
  functions/architect        Claude gateway (server-side key)
  functions/tts              optional external TTS gateway
```

## Session 001 script

The brief asked to insert a previously written "Session 001" script, but that text was not included,
so an original script was written with the six required chapters (Induction, Reprogramming Your
Identity, Wealth Conditioning, Intellectual Expansion, The Execution Identity, Return). To use your own,
replace the chapter texts in `SESSION_001` in `src/content/hypnosis.ts`. The built-in version is
read-only in the app; users edit a personal copy.

## Safety and honesty

- Hypnosis sessions are framed as relaxation and self-development exercises, with a safety notice on
  every session page. No claims of guaranteed results, unlimited intelligence or control of others.
- Wealth content is educational with disclaimers; calculators state their assumptions; no bank
  connections or transactions.
- The AI never pretends to be connected; demo responses are labelled. Journal content goes to AI only
  with explicit consent, and private notes never do.
- Analytics count logged practice and say plainly that this is not a measure of intelligence or wealth.
