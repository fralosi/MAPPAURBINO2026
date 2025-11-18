-- MIGRAZIONE INIZIALE - URBINO FOCUS GAME (Supabase Postgres)
-- Crea tabelle principali per utenti, asset, acquisti, chat e notifiche

-- Utenti
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  display_name text not null,
  avatar_url text,
  balance numeric(12,2) not null default 0,
  share_location boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Asset immobiliari mappati
create table if not exists assets (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- es: casa, negozio, ristorante, hotel
  name text not null,
  base_price numeric(12,2) not null,
  hourly_yield numeric(10,2) not null,
  location_geojson jsonb not null,
  min_level int default 1,
  created_at timestamptz not null default now()
);

-- Asset posseduti dagli utenti
create table if not exists user_assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  level int not null default 1,
  last_yield_claimed_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

-- Transazioni economiche
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(12,2) not null,
  type text not null, -- purchase, sale, yield, upgrade
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Sessione utente attiva (tracking presenza/tab)
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  session_token text not null unique,
  is_active boolean not null default true,
  last_ping timestamptz not null default now()
);

-- Chat locale/di gruppo
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  from_user uuid not null references users(id),
  to_scope text not null, -- es: 'local:<cellId>' o 'group:<groupId>'
  message text not null,
  created_at timestamptz not null default now()
);

-- Notifiche (popup, richieste, reminder)
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  payload jsonb not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indici ottimizzati per query real-time/chat/notifiche
create index if not exists idx_user_last_seen on users(last_seen);
create index if not exists idx_asset_location on assets using gin(location_geojson);
create index if not exists idx_user_assets_user on user_assets(user_id);
create index if not exists idx_chat_scope_created on chat_messages(to_scope, created_at desc);
create index if not exists idx_sessions_active on sessions(is_active, last_ping);
