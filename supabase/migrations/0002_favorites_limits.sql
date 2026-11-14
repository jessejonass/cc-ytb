-- Limites de tamanho/formato para os dados enviados pelo cliente.
-- Espelha a validação de addFavorite (src/lib/favorite-input.ts).
alter table public.favorites
  add constraint favorites_title_length
    check (char_length(title) between 1 and 300),
  add constraint favorites_poster_path_length
    check (poster_path is null or char_length(poster_path) <= 200),
  add constraint favorites_release_year_format
    check (release_year is null or release_year ~ '^\d{4}$');
