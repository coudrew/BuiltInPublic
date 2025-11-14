-- ============================================================
-- Chat Feature Base Schema
-- Date: 2025-11-14
-- ============================================================

-- ============================================================
-- 0. PROFILES (SKIP IF YOU ALREADY HAVE THIS)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'profiles_select_all'
  ) then
    create policy profiles_select_all
    on public.profiles
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'profiles_insert_self'
  ) then
    create policy profiles_insert_self
    on public.profiles
    for insert
    with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'profiles_update_self'
  ) then
    create policy profiles_update_self
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end$$;

-- ============================================================
-- 1. FRIENDSHIPS
-- ============================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now()
);

alter table public.friendships enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'friendships_select'
  ) then
    create policy friendships_select
    on public.friendships
    for select
    using (
      auth.uid() = requester_id
      or auth.uid() = addressee_id
    );
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'friendships_insert'
  ) then
    create policy friendships_insert
    on public.friendships
    for insert
    with check (auth.uid() = requester_id);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'friendships_update'
  ) then
    create policy friendships_update
    on public.friendships
    for update
    using (
      auth.uid() = requester_id
      or auth.uid() = addressee_id
    )
    with check (
      auth.uid() = requester_id
      or auth.uid() = addressee_id
    );
  end if;
end$$;

-- ============================================================
-- 2. CONVERSATIONS (TABLE ONLY FOR NOW)
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  last_message_at timestamptz
);

alter table public.conversations enable row level security;

-- ============================================================
-- 3. CONVERSATION PARTICIPANTS
-- ============================================================

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'participants_select'
  ) then
    create policy participants_select
    on public.conversation_participants
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'participants_insert_self'
  ) then
    create policy participants_insert_self
    on public.conversation_participants
    for insert
    with check (auth.uid() = user_id);
  end if;
end$$;

-- ============================================================
-- 4. CONVERSATION POLICIES (NOW THAT PARTICIPANTS EXISTS)
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'conversations_select'
  ) then
    create policy conversations_select
    on public.conversations
    for select
    using (
      exists (
        select 1
        from public.conversation_participants cp
        where cp.conversation_id = conversations.id
          and cp.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'conversations_insert_any'
  ) then
    create policy conversations_insert_any
    on public.conversations
    for insert
    with check (true);
  end if;
end$$;

-- ============================================================
-- 5. MESSAGES
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

alter table public.messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'messages_select'
  ) then
    create policy messages_select
    on public.messages
    for select
    using (
      exists (
        select 1
        from public.conversation_participants cp
        where cp.conversation_id = messages.conversation_id
          and cp.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'messages_insert'
  ) then
    create policy messages_insert
    on public.messages
    for insert
    with check (
      sender_id = auth.uid()
      and exists (
        select 1
        from public.conversation_participants cp
        where cp.conversation_id = messages.conversation_id
          and cp.user_id = auth.uid()
      )
    );
  end if;
end$$;

-- ============================================================
-- DONE
-- ============================================================