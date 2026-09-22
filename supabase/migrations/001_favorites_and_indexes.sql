-- SabiLearn migration: favorites table + performance indexes
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

-- Favorites: parents/students save tutors. user_id stores the Supabase auth user
-- uuid as text, matching the tutors.user_id convention.
create table if not exists public.favorites (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    tutor_id uuid not null references public.tutors(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, tutor_id)
);

create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_tutor_id_idx on public.favorites(tutor_id);

-- Row level security: only the service role (used by the API routes) may touch
-- favorites, so leave no policies — RLS enabled with none blocks anon/authenticated access.
alter table public.favorites enable row level security;

-- Speed up booking and review lookups
create index if not exists sessions_tutor_id_idx on public.sessions(tutor_id);
create index if not exists sessions_student_id_idx on public.sessions(student_id);
create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists reviews_tutor_id_idx on public.reviews(tutor_id);
