-- Whispie Initial Database Schema
-- Run this after connecting Supabase project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  role text, -- e.g., 'manager', 'individual_contributor', 'executive'
  industry text, -- e.g., 'tech', 'finance', 'healthcare'
  experience_level text, -- e.g., 'entry', 'mid', 'senior'
  onboarding_completed boolean default false,
  tier text default 'free' check (tier in ('free', 'pro')),
  scenarios_used_this_month integer default 0,
  voice_credits integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- PERSONAS (AI characters to roleplay with)
-- ============================================
create table public.personas (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  title text not null, -- e.g., 'Micromanaging Boss'
  description text not null,
  personality_traits text[] not null, -- e.g., ['impatient', 'detail-oriented']
  communication_style text not null, -- e.g., 'aggressive', 'passive-aggressive'
  avatar_url text,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- ============================================
-- SCENARIOS (conversation situations)
-- ============================================
create table public.scenarios (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  category text not null, -- e.g., 'feedback', 'negotiation', 'conflict'
  context text not null, -- background info for the scenario
  objectives text[] not null, -- what user should accomplish
  persona_id uuid references public.personas on delete set null,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  estimated_turns integer default 10,
  is_premium boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- ============================================
-- CONVERSATIONS (user chat sessions)
-- ============================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  scenario_id uuid references public.scenarios on delete set null,
  persona_id uuid references public.personas on delete set null,
  status text default 'active' check (status in ('active', 'completed', 'abandoned')),
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  total_turns integer default 0,
  created_at timestamp with time zone default now()
);

-- ============================================
-- MESSAGES (individual chat messages)
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- ANALYSES (post-conversation feedback)
-- ============================================
create table public.analyses (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null unique,
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  clarity_score integer check (clarity_score >= 0 and clarity_score <= 100),
  empathy_score integer check (empathy_score >= 0 and empathy_score <= 100),
  assertiveness_score integer check (assertiveness_score >= 0 and assertiveness_score <= 100),
  professionalism_score integer check (professionalism_score >= 0 and professionalism_score <= 100),
  strengths text[],
  improvements text[],
  summary text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_status on public.conversations(status);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_scenarios_category on public.scenarios(category);
create index idx_scenarios_is_active on public.scenarios(is_active);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.personas enable row level security;
alter table public.scenarios enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.analyses enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Personas: everyone can read active personas
create policy "Anyone can view active personas"
  on public.personas for select
  using (is_active = true);

-- Scenarios: everyone can read active scenarios
create policy "Anyone can view active scenarios"
  on public.scenarios for select
  using (is_active = true);

-- Conversations: users can only access their own
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

-- Messages: users can only access messages in their conversations
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Analyses: users can only access analyses for their conversations
create policy "Users can view analyses for own conversations"
  on public.analyses for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = analyses.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();
