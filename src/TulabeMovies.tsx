"use client";
import { useState, useEffect, useCallback } from "react";
import type { Movie, Genre, Pagination, Series, SeriesDetail, Episode } from "./tulabe-types";
import { getMovies, getGenres, getMovieDetail, getSeries, getSeriesDetail, proxyHls } from "./tulabe-api";
import VideoPlayer from "./VideoPlayer";
import "./TulabeMovies.css";

type Tab = "movies" | "series";

export default function TulabeMovies() {
  const [tab, setTab]                = useState<Tab>("movies");

  // ── Movies state ──────────────────────────────────────────────────────────
  const [movies, setMovies]          = useState<Movie[]>([]);
  const [genres, setGenres]          = useState<Genre[]>([]);
  const [pagination, setPagination]  = useState<Pagination | null>(null);
  const [loading, setLoading]        = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>();
  const [latestOnly, setLatestOnly]  = useState(false);
  const [page, setPage]              = useState(1);
  const [selected, setSelected]      = useState<Movie | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeQuality, setActiveQuality] = useState<string>("");

  // ── Series state ──────────────────────────────────────────────────────────
  const [seriesList, setSeriesList]  = useState<Series[]>([]);
  const [seriesPage, setSeriesPage]  = useState(1);
  const [seriesPagination, setSeriesPagination] = useState<Pagination | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesDetail | null>(null);
  const [seriesDetailLoading, setSeriesDetailLoading] = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    getGenres().then(setGenres).catch(() => {});
  }, []);

  // ── Movies loader ─────────────────────────────────────────────────────────
  const loadMovies = useCallback(async (p: number, genre?: number, latest?: boolean) => {
    setLoading(true);
    try {
      const data = await getMovies({ page: p, limit: 20, genre_id: genre, latest });
      setMovies(data.movies);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "movies") loadMovies(page, selectedGenre, latestOnly || undefined);
  }, [tab, page, selectedGenre, latestOnly, loadMovies]);

  // ── Series loader ─────────────────────────────────────────────────────────
  const loadSeries = useCallback(async (p: number) => {
    setSeriesLoading(true);
    try {
      const data = await getSeries({ page: p, limit: 20 });
      setSeriesList(data.series);
      setSeriesPagination(data.pagination);
    } finally {
      setSeriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "series") loadSeries(seriesPage);
  }, [tab, seriesPage, loadSeries]);

  // ── Movie detail ──────────────────────────────────────────────────────────
  async function openMovie(movie: Movie) {
    if (movie.qualities?.length) {
      setSelected(movie);
      setActiveQuality(proxyHls(movie.qualities[movie.qualities.length - 1].playlist_url));
      return;
    }
    setDetailLoading(true);
    try {
      const detail = await getMovieDetail(movie.id);
      setSelected(detail);
      setActiveQuality(detail.qualities?.length ? proxyHls(detail.qualities[detail.qualities.length - 1].playlist_url) : "");
    } finally {
      setDetailLoading(false);
    }
  }

  // ── Series detail ─────────────────────────────────────────────────────────
  async function openSeries(s: Series) {
    setSeriesDetailLoading(true);
    setSelectedSeries(null);
    setActiveEpisode(null);
    try {
      const detail = await getSeriesDetail(s.id);
      setSelectedSeries(detail);
      setActiveSeason(detail.seasons?.[0]?.season ?? 1);
      setActiveEpisode(detail.seasons?.[0]?.episodes?.[0] ?? null);
    } finally {
      setSeriesDetailLoading(false);
    }
  }

  function closeMovieModal()  { setSelected(null); setActiveQuality(""); }
  function closeSeriesModal() { setSelectedSeries(null); setActiveEpisode(null); }

  function handleGenre(id?: number) { setSelectedGenre(id); setLatestOnly(false); setPage(1); }
  function handleLatest()           { setLatestOnly(true); setSelectedGenre(undefined); setPage(1); }

  return (
    <div className="tulabe">
      {/* ── Header + Tabs ── */}
      <div className="t-header">
        <div className="t-header-inner">
          <img src="https://tulabe.lectify.education/brand/tulabe-logo.png" alt="Tulabe" className="t-logo" />
          <div className="t-tabs">
            <button className={`t-tab ${tab === "movies" ? "active" : ""}`} onClick={() => setTab("movies")}>Movies</button>
            <button className={`t-tab ${tab === "series" ? "active" : ""}`} onClick={() => setTab("series")}>Series</button>
          </div>
          <span className="t-count">
            {tab === "movies" && pagination ? `${pagination.total} movies` : ""}
            {tab === "series" && seriesPagination ? `${seriesPagination.total} series` : ""}
          </span>
        </div>
      </div>

      {/* ══════════════════════ MOVIES TAB ══════════════════════ */}
      {tab === "movies" && (
        <>
          <div className="t-filters">
            <button className={`t-chip ${!selectedGenre && !latestOnly ? "active" : ""}`} onClick={() => handleGenre(undefined)}>All</button>
            <button className={`t-chip ${latestOnly ? "active" : ""}`} onClick={handleLatest}>Latest</button>
            {genres.map((g) => (
              <button key={g.id} className={`t-chip ${selectedGenre === g.id ? "active" : ""}`} onClick={() => handleGenre(g.id)}>
                {g.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="t-spinner-wrap"><span className="t-spinner" /></div>
          ) : (
            <div className="t-grid">
              {movies.map((m) => (
                <div key={m.id} className="t-card" onClick={() => openMovie(m)}>
                  <div className="t-poster-wrap">
                    <img className="t-poster" src={m.thumbnail_url} alt={m.title} loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/300x450/1a1a25/666?text=No+Image"; }} />
                    {m.is_latest && <span className="t-new">NEW</span>}
                    {m.allow_1080p && <span className="t-hd">1080p</span>}
                  </div>
                  <div className="t-info">
                    <p className="t-title">{m.title}</p>
                    <p className="t-meta">{m.release_year} · {m.genre_names?.split(",")[0]?.trim()}</p>
                    {m.vj_names && <p className="t-vj">VJ {m.vj_names}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <div className="t-pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span>Page {page} of {pagination.total_pages}</span>
              <button disabled={page === pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════ SERIES TAB ══════════════════════ */}
      {tab === "series" && (
        <>
          {seriesLoading ? (
            <div className="t-spinner-wrap"><span className="t-spinner" /></div>
          ) : (
            <div className="t-grid">
              {seriesList.map((s) => (
                <div key={s.id} className="t-card" onClick={() => openSeries(s)}>
                  <div className="t-poster-wrap">
                    <img className="t-poster" src={s.thumbnail_url} alt={s.title} loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/300x450/1a1a25/666?text=No+Image"; }} />
                    <span className="t-seasons-badge">{s.total_seasons} S</span>
                  </div>
                  <div className="t-info">
                    <p className="t-title">{s.title}</p>
                    <p className="t-meta">{s.release_year} · {s.genre_names?.split(",")[0]?.trim()}</p>
                    {s.vj_names && <p className="t-vj">VJ {s.vj_names}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {seriesPagination && seriesPagination.total_pages > 1 && (
            <div className="t-pagination">
              <button disabled={seriesPage === 1} onClick={() => setSeriesPage((p) => p - 1)}>← Prev</button>
              <span>Page {seriesPage} of {seriesPagination.total_pages}</span>
              <button disabled={seriesPage === seriesPagination.total_pages} onClick={() => setSeriesPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════ MOVIE MODAL ══════════════════════ */}
      {(selected || detailLoading) && (
        <div className="t-overlay" onClick={closeMovieModal}>
          <div className="t-modal" onClick={(e) => e.stopPropagation()}>
            <button className="t-close" onClick={closeMovieModal}>✕</button>
            {detailLoading ? (
              <div className="t-spinner-wrap"><span className="t-spinner" /></div>
            ) : selected && (
              <>
                {activeQuality ? <VideoPlayer src={activeQuality} /> : (
                  <img src={selected.thumbnail_url} alt={selected.title} className="t-modal-poster" />
                )}
                {selected.qualities?.length > 0 && (
                  <div className="t-qualities">
                    {selected.qualities.map((q) => (
                      <button key={q.id}
                        className={`t-q-btn ${activeQuality === proxyHls(q.playlist_url) ? "active" : ""}`}
                        onClick={() => setActiveQuality(proxyHls(q.playlist_url))}
                      >{q.quality}</button>
                    ))}
                  </div>
                )}
                <div className="t-modal-info">
                  <h2>{selected.title}</h2>
                  <div className="t-modal-tags">
                    <span>{selected.release_year}</span>
                    {selected.genre_names?.split(",").map((g) => <span key={g}>{g.trim()}</span>)}
                    {selected.vj_names && <span>VJ {selected.vj_names}</span>}
                    {selected.language_translated && <span>{selected.language_translated.toUpperCase()}</span>}
                    <span>{selected.view_count} views</span>
                  </div>
                  {selected.description && <p className="t-modal-desc">{selected.description}</p>}
                  <details className="t-raw">
                    <summary>Raw JSON (for API use)</summary>
                    <pre>{JSON.stringify(selected, null, 2)}</pre>
                  </details>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ SERIES MODAL ══════════════════════ */}
      {(selectedSeries || seriesDetailLoading) && (
        <div className="t-overlay" onClick={closeSeriesModal}>
          <div className="t-modal t-modal-series" onClick={(e) => e.stopPropagation()}>
            <button className="t-close" onClick={closeSeriesModal}>✕</button>
            {seriesDetailLoading ? (
              <div className="t-spinner-wrap"><span className="t-spinner" /></div>
            ) : selectedSeries && (
              <>
                {/* Active episode player */}
                {activeEpisode?.stream_url ? (
                  <VideoPlayer key={activeEpisode.id} src={activeEpisode.stream_url} />
                ) : activeEpisode ? (
                  <img src={activeEpisode.poster_url || activeEpisode.thumbnail_url} alt={activeEpisode.title} className="t-modal-poster" />
                ) : (
                  <img src={selectedSeries.thumbnail_url} alt={selectedSeries.title} className="t-modal-poster" />
                )}

                <div className="t-modal-info">
                  <h2>{selectedSeries.title}</h2>
                  <div className="t-modal-tags">
                    <span>{selectedSeries.release_year}</span>
                    {selectedSeries.genre_names?.split(",").map((g) => <span key={g}>{g.trim()}</span>)}
                    {selectedSeries.vj_names && <span>VJ {selectedSeries.vj_names}</span>}
                    <span>{selectedSeries.total_seasons} seasons</span>
                  </div>
                  {selectedSeries.description && <p className="t-modal-desc">{selectedSeries.description}</p>}

                  {/* Season selector */}
                  {selectedSeries.seasons?.length > 0 && (
                    <div className="t-season-tabs">
                      {selectedSeries.seasons.map((s) => (
                        <button key={s.season}
                          className={`t-q-btn ${activeSeason === s.season ? "active" : ""}`}
                          onClick={() => { setActiveSeason(s.season); setActiveEpisode(s.episodes[0] ?? null); }}
                        >Season {s.season}</button>
                      ))}
                    </div>
                  )}

                  {/* Episode list */}
                  {selectedSeries.seasons?.find((s) => s.season === activeSeason)?.episodes?.length > 0 && (
                    <div className="t-episode-list">
                      {selectedSeries.seasons.find((s) => s.season === activeSeason)!.episodes.map((ep) => (
                        <div key={ep.id}
                          className={`t-episode ${activeEpisode?.id === ep.id ? "active" : ""}`}
                          onClick={() => setActiveEpisode(ep)}
                        >
                          <img src={ep.poster_url || ep.thumbnail_url} alt={ep.title}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/160x90/1a1a25/666?text=Ep"; }} />
                          <div>
                            <p className="t-ep-title">Ep {ep.episode_number}{ep.part_number > 1 ? ` Part ${ep.part_number}` : ""}</p>
                            <p className="t-ep-subtitle">{ep.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
