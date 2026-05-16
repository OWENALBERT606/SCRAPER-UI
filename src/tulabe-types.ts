export interface VideoQuality {
  id: string;
  quality: string;
  playlist_url: string;
  status: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  status: string;
  thumbnail_url: string;
  release_year: number;
  genre_names: string;
  vj_names: string;
  view_count: number;
  duration_seconds: number;
  allow_1080p: boolean;
  language_translated: string;
  is_latest: boolean;
  qualities: VideoQuality[];
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Series {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  release_year: number;
  genre_names: string;
  vj_names: string;
  view_count: number;
  status: string;
  total_seasons: number;
  created_at: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  part_number: number;
  season_number: number;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
  status: string;
  poster_url: string;
  stream_url: string;
}

export interface Season {
  season: number;
  episodes: Episode[];
}

export interface SeriesDetail extends Series {
  seasons: Season[];
}
