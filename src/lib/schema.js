export const SQL = `create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text unique not null,
  profile_photo text, location text,
  preferences jsonb default '{}',          -- keukens, genres, niveaus, interesses, avoid
  dietary_preferences text[] default '{}',
  transport_options text[] default '{}',
  notification_settings jsonb default '{"push":true}',
  created_at timestamptz default now()
);
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null, image text, invite_code text unique not null,
  created_by uuid references users(id),
  group_preferences jsonb default '{}',    -- budget, km, keukens, never, io ...
  learned_profile jsonb default '{}',      -- {tag: {y, n}}
  created_at timestamptz default now()
);
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('beheerder','lid')) default 'lid',
  active_status boolean default true,
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);
create table decision_rounds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  created_by uuid references users(id),
  title text not null,
  categories text[], activity_levels text[], moods text[], interest_areas text[],
  location text, date date, start_time time, end_time time,
  budget_min numeric default 0, budget_max numeric,
  max_distance numeric, transport_options text[],
  indoor_outdoor text[], group_size int,
  constraints jsonb default '{}',          -- reservering, alcohol, leeftijd, dieet, toegankelijk
  voting_rule jsonb not null,              -- {type, pct, pair}
  deadline timestamptz,
  status text check (status in ('active','done')) default 'active',
  created_at timestamptz default now()
);
create table options (
  id uuid primary key default gen_random_uuid(),
  type text not null, title text not null, description text, image text,
  location text, latitude double precision, longitude double precision,
  price numeric, rating numeric, duration int,
  opening_hours jsonb, activity_level text,
  moods text[], interest_areas text[], categories text[],
  indoor_outdoor text, group_size_min int, group_size_max int,
  booking_url text, availability jsonb, metadata jsonb   -- menu, genre, platform, needs ...
);
create table round_options (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references decision_rounds(id) on delete cascade,
  option_id uuid references options(id),
  ranking_score numeric, eligible_status boolean default true
);
create table votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references decision_rounds(id) on delete cascade,
  option_id uuid references options(id),
  user_id uuid references users(id) on delete cascade,
  vote_type text check (vote_type in ('yes','no','later')),
  created_at timestamptz default now(),
  unique (round_id, option_id, user_id)
);
create table matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references decision_rounds(id) on delete cascade,
  option_id uuid references options(id),
  match_type text, matched_at timestamptz default now(),
  final_choice_status boolean default false
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  round_id uuid references decision_rounds(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  message_type text check (message_type in ('text','image','card','reaction')),
  content text, shared_option_id uuid references options(id),
  created_at timestamptz default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text, title text, message text,
  read_status boolean default false,
  created_at timestamptz default now()
);
create index on votes (round_id, option_id);
create index on round_options (round_id, ranking_score desc);
-- RLS: alleen leden van een groep lezen groups/rounds/messages;
-- votes zijn alleen leesbaar voor de eigenaar; matches worden server-side berekend.`;
