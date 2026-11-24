-- The Limitless Mind: database schema with Row Level Security.
-- Every table is private to its owner: auth.uid() must equal user_id for every operation.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper to create a standard owned table.
create or replace function public._lm_owned(tbl text, cols text) returns void language plpgsql as $$
begin
  execute format('create table if not exists public.%I (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      %s)', tbl, cols);
  execute format('create index if not exists %I on public.%I (user_id)', tbl || '_user_idx', tbl);
  execute format('alter table public.%I enable row level security', tbl);
  execute format('drop policy if exists "owner select" on public.%I', tbl);
  execute format('drop policy if exists "owner insert" on public.%I', tbl);
  execute format('drop policy if exists "owner update" on public.%I', tbl);
  execute format('drop policy if exists "owner delete" on public.%I', tbl);
  execute format('create policy "owner select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', tbl);
  execute format('create policy "owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', tbl);
  execute format('create policy "owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', tbl);
  execute format('create policy "owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', tbl);
end $$;

select public._lm_owned('user_preferences', $c$
  onboarded boolean not null default false, display_name text not null default '', objectives jsonb not null default '[]',
  learning_style text not null default 'mixed', financial_ambition text not null default '', session_length int not null default 15,
  daily_minutes int not null default 45, coaching_tone text not null default 'direct', theme text not null default 'dark',
  daily_statement text not null default '', focus jsonb, routine jsonb, journal_ai_consent boolean not null default false,
  notifications boolean not null default false, currency text not null default 'GBP' $c$);
create unique index if not exists user_preferences_one_per_user on public.user_preferences (user_id);

select public._lm_owned('hypnosis_sessions', $c$
  title text not null, category text not null default 'Personal', objective text not null default '', chapters jsonb not null default '[]',
  source text not null default 'custom' check (source in ('generated','template','custom','edited_copy')), base_id text,
  duration_min int not null default 15, tone text not null default '', reflection jsonb not null default '[]' $c$);

select public._lm_owned('session_progress', $c$
  session_id text not null, chapter int not null default 0, char_index int not null default 0, completed_count int not null default 0,
  favourite boolean not null default false, last_played_at timestamptz, seconds_listened int not null default 0 $c$);

select public._lm_owned('journal_entries', $c$
  kind text not null default 'free', title text not null default '', body text not null default '', answers jsonb not null default '{}',
  tags jsonb not null default '[]', mood smallint check (mood between 1 and 5), is_private boolean not null default false,
  entry_date date not null default current_date $c$);

select public._lm_owned('affirmations', $c$ text text not null, category text not null default 'General', pinned boolean not null default false $c$);
select public._lm_owned('learning_subjects', $c$ subject_id text not null, level text not null default 'Beginner', enrolled boolean not null default true $c$);
select public._lm_owned('learning_modules', $c$ lesson_id text not null, subject_id text not null, notes text not null default '', bookmarked boolean not null default false $c$);
select public._lm_owned('learning_progress', $c$ lesson_id text not null, subject_id text not null, level text not null, completed_at timestamptz not null default now(), minutes int not null default 0 $c$);
select public._lm_owned('flashcards', $c$ deck text not null, front text not null, back text not null, srs jsonb, due timestamptz not null default now(), source text not null default 'manual' $c$);
select public._lm_owned('quiz_results', $c$ quiz_id text not null, subject_id text not null, score int not null, total int not null $c$);

select public._lm_owned('goals', $c$
  title text not null, description text not null default '', horizon text not null default '30d' check (horizon in ('short','30d','90d','annual')),
  category text not null default 'Personal', deadline date, priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'active' check (status in ('active','completed','paused')), notes text not null default '',
  is_project boolean not null default false,
  stage text not null default 'planning' check (stage in ('idea','research','validation','planning','execution','review','completion')) $c$);

select public._lm_owned('milestones', $c$ goal_id uuid not null references public.goals(id) on delete cascade, title text not null, due date, done boolean not null default false $c$);
select public._lm_owned('tasks', $c$
  goal_id uuid references public.goals(id) on delete cascade, milestone_id uuid references public.milestones(id) on delete set null,
  title text not null, due date, done boolean not null default false, done_at timestamptz,
  kind text not null default 'task' check (kind in ('task','commitment','wealth_action')), priority text not null default 'medium' $c$);
select public._lm_owned('habits', $c$ title text not null, category text not null default 'General', log jsonb not null default '[]', archived boolean not null default false $c$);
select public._lm_owned('wealth_records', $c$
  kind text not null check (kind in ('revenue','expense','saving','business_income','target')), amount numeric(14,2) not null check (amount >= 0),
  category text not null default 'General', note text not null default '', record_date date not null default current_date $c$);
select public._lm_owned('ai_conversations', $c$ title text not null default 'Conversation', saved boolean not null default false $c$);
select public._lm_owned('ai_messages', $c$ conversation_id uuid not null references public.ai_conversations(id) on delete cascade, role text not null check (role in ('user','assistant')), content text not null, demo boolean not null default false $c$);
select public._lm_owned('saved_resources', $c$ title text not null, url text not null check (url ~* '^https?://'), subject_id text not null default '', note text not null default '' $c$);
select public._lm_owned('activity_log', $c$ kind text not null, minutes int not null default 0, ref text not null default '', occurred_on date not null default current_date $c$);
select public._lm_owned('recordings', $c$
  title text not null, kind text not null check (kind in ('voice','upload','generated')), storage_path text not null,
  duration_sec int not null default 0, mime text not null default 'audio/webm', session_id text $c$);

drop function public._lm_owned(text, text);

-- Supabase grants these by default; stated explicitly so RLS is the only gate.
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- Profiles RLS + auto-create on signup
alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Keep updated_at honest
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','user_preferences','hypnosis_sessions','session_progress','journal_entries','affirmations','learning_subjects','learning_modules','learning_progress','flashcards','quiz_results','goals','milestones','tasks','habits','wealth_records','ai_conversations','ai_messages','saved_resources','activity_log','recordings'] loop
    execute format('drop trigger if exists touch on public.%I', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- User-controlled account deletion (only ever deletes the caller).
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from storage.objects where bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Private storage bucket for voice recordings / uploads: files live under <user_id>/...
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false) on conflict (id) do nothing;
drop policy if exists "recordings owner read" on storage.objects;
drop policy if exists "recordings owner write" on storage.objects;
drop policy if exists "recordings owner delete" on storage.objects;
create policy "recordings owner read" on storage.objects for select to authenticated using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recordings owner write" on storage.objects for insert to authenticated with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recordings owner delete" on storage.objects for delete to authenticated using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
