-- Estado de cada filme para cada pessoa: "quero" (quero assistir) ou "assistido".
-- Uma linha por (pessoa, filme): os estados são exclusivos pelo próprio formato da tabela.
create table public.watch_status (
  user_id uuid not null references auth.users on delete cascade,
  movie_id int not null,
  status text not null,
  title text not null,
  poster_path text,
  release_year text,
  updated_at timestamptz not null default now(),
  primary key (user_id, movie_id),
  constraint watch_status_status_valid check (status in ('quero', 'assistido')),
  -- mesmos limites de favorites (0002_favorites_limits.sql)
  constraint watch_status_title_length check (char_length(title) between 1 and 300),
  constraint watch_status_poster_path_length check (poster_path is null or char_length(poster_path) <= 200),
  constraint watch_status_release_year_format check (release_year is null or release_year ~ '^\d{4}$')
);

alter table public.watch_status enable row level security;

create policy "watch_status_select_own" on public.watch_status
  for select using (auth.uid() = user_id);

create policy "watch_status_insert_own" on public.watch_status
  for insert with check (auth.uid() = user_id);

create policy "watch_status_update_own" on public.watch_status
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "watch_status_delete_own" on public.watch_status
  for delete using (auth.uid() = user_id);
