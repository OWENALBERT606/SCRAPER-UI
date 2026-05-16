const BASE = "http://localhost:3000/labafilm";

export interface LabaMovie {
  _id: string;
  title: string;
  overview: string;
  poster: string;
  video: string;
  vj: string;
  release_date: string;
  genres: string[];
  director: string;
  country: string;
  company: string;
  rating: number;
}

export interface LabaMovieListItem {
  _id: string;
  title: string;
  vj: string;
  poster: string;
  release_date: string;
  rating?: number;
}

export interface LabaSeries {
  _id: string;
  title: string;
  vj: string;
  poster: string;
  first_air_date: string;
  latestSeason: number;
  latestEpisode: number;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json();
  return json;
}

export async function getLabaMovies(opts: { page?: number; limit?: number; genre?: string; search?: string } = {}) {
  const { page = 1, limit = 20, genre, search } = opts;
  let qs = `?page=${page}&limit=${limit}`;
  if (genre)  qs += `&genre=${encodeURIComponent(genre)}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  return get<{ success: boolean; movies: LabaMovie[] }>(`/movies${qs}`);
}

export async function getLabaMovieDetail(id: string) {
  return get<{ success: boolean; movie: LabaMovie }>(`/movies/${id}`);
}

export async function getLabaFeatured() {
  return get<{ success: boolean; movies: LabaMovieListItem[] }>("/movies/featured");
}

export async function getLabaLatest() {
  return get<{ success: boolean; movies: LabaMovieListItem[] }>("/movies/latest");
}

export async function getLabaPopular() {
  return get<{ success: boolean; movies: LabaMovieListItem[] }>("/movies/popular");
}

export async function getLabaSimilar(id: string) {
  return get<{ success: boolean; movies: LabaMovieListItem[] }>(`/movies/${id}/similar`);
}

export async function getLabaSeriesLatest() {
  return get<{ success: boolean; series: LabaSeries[] }>("/series/latest");
}

export async function getLabaSeriesPopular() {
  return get<{ success: boolean; series: LabaSeries[] }>("/series/popular");
}

export async function getLabaAllMovies() {
  return get<{ success: boolean; total: number; movies: LabaMovieListItem[] }>("/movies/all");
}

export async function getLabaAllSeries() {
  return get<{ success: boolean; total: number; series: LabaSeries[] }>("/series/all");
}
