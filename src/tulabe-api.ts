import type { Movie, Genre, Pagination, Series, SeriesDetail } from "./tulabe-types";

const BASE        = "http://localhost:3000/api/tulabe";
const PROXY_BASE  = "http://localhost:3000/api/proxy";

export function proxyHls(url: string): string {
  return `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
}

export async function getMovies(opts: {
  page?: number;
  limit?: number;
  genre_id?: number;
  latest?: boolean;
} = {}): Promise<{ movies: Movie[]; pagination: Pagination }> {
  const { page = 1, limit = 20, genre_id, latest } = opts;
  let qs = `?page=${page}&limit=${limit}`;
  if (genre_id) qs += `&genre_id=${genre_id}`;
  if (latest)   qs += `&latest=true`;
  const res = await fetch(`${BASE}/movies${qs}`);
  const json = await res.json();
  return json.data;
}

export async function getMovieDetail(id: string): Promise<Movie> {
  const res = await fetch(`${BASE}/movies/${id}`);
  const json = await res.json();
  return json.data;
}

export async function getGenres(): Promise<Genre[]> {
  const res = await fetch(`${BASE}/genres`);
  const json = await res.json();
  return json.data;
}

export async function getSeries(opts: { page?: number; limit?: number } = {}): Promise<{ series: Series[]; pagination: Pagination }> {
  const { page = 1, limit = 20 } = opts;
  const res  = await fetch(`${BASE}/series?page=${page}&limit=${limit}`);
  const json = await res.json();
  return json.data;
}

export async function getSeriesDetail(id: number): Promise<SeriesDetail> {
  const res  = await fetch(`${BASE}/series/${id}`);
  const json = await res.json();
  return json.data;
}
