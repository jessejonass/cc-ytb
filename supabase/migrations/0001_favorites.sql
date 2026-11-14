create table public.favorites (
  user_id uuid not null references auth.users on delete cascade,
  movie_id int not null,
  title text not null,
  poster_path text,
  release_year text,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);
