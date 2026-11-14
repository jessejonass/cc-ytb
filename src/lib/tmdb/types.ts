export interface TmdbMovieSummary {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
}

export interface TmdbPaged<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface TmdbProvider {
  provider_id: number
  provider_name: string
  logo_path: string | null
  display_priority: number
}

export interface TmdbWatchRegion {
  link?: string
  flatrate?: TmdbProvider[]
  free?: TmdbProvider[]
  ads?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
}

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface TmdbCrewMember {
  id: number
  name: string
  job: string
  department: string
}

export interface TmdbVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export interface TmdbMovieDetail
  extends Omit<TmdbMovieSummary, 'genre_ids'> {
  genre_ids?: number[]
  runtime: number | null
  genres: TmdbGenre[]
  credits: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] }
  videos: { results: TmdbVideo[] }
  'watch/providers': { results: Record<string, TmdbWatchRegion> }
  recommendations: TmdbPaged<TmdbMovieSummary>
}
