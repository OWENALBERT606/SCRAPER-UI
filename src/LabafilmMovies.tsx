import { useState, useEffect, useCallback } from "react";
import {
  getLabaLatest, getLabaPopular, getLabaFeatured,
  getLabaMovieDetail, getLabaSimilar,
  getLabaSeriesLatest, getLabaSeriesPopular,
  getLabaAllMovies, getLabaAllSeries,
  type LabaMovie, type LabaMovieListItem, type LabaSeries,
} from "./labafilm-api";
import "./LabafilmMovies.css";

type Section = "featured" | "latest" | "popular" | "all" | "series" | "series-all";

export default function LabafilmMovies() {
  const [section, setSection]     = useState<Section>("latest");
  const [movies, setMovies]       = useState<LabaMovieListItem[]>([]);
  const [series, setSeries]       = useState<LabaSeries[]>([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState<LabaMovie | null>(null);
  const [similar, setSimilar]     = useState<LabaMovieListItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async (s: Section) => {
    setLoading(true);
    setMovies([]);
    setSeries([]);
    try {
      if (s === "featured") {
        const r = await getLabaFeatured();
        setMovies(r.movies ?? []);
      } else if (s === "latest") {
        const r = await getLabaLatest();
        setMovies(r.movies ?? []);
      } else if (s === "popular") {
        const r = await getLabaPopular();
        setMovies(r.movies ?? []);
      } else if (s === "all") {
        const r = await getLabaAllMovies();
        setMovies(r.movies ?? []);
      } else if (s === "series") {
        const [lat, pop] = await Promise.all([getLabaSeriesLatest(), getLabaSeriesPopular()]);
        const seen = new Set<string>();
        const merged: LabaSeries[] = [];
        for (const item of [...(lat.series ?? []), ...(pop.series ?? [])]) {
          if (!seen.has(item._id)) { seen.add(item._id); merged.push(item); }
        }
        setSeries(merged);
      } else if (s === "series-all") {
        const r = await getLabaAllSeries();
        setSeries(r.series ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(section); }, [section, load]);

  async function openMovie(item: LabaMovieListItem) {
    setModalLoading(true);
    setSelected(null);
    setSimilar([]);
    try {
      const [detail, sim] = await Promise.all([
        getLabaMovieDetail(item._id),
        getLabaSimilar(item._id),
      ]);
      setSelected(detail.movie);
      setSimilar(sim.movies ?? []);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() { setSelected(null); setSimilar([]); }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    if (section === "series" || section === "series-all") setSection("latest");
  }

  return (
    <div className="laba">
      {/* Header */}
      <div className="laba-header">
        <div className="laba-header-inner">
          <div className="laba-brand">
            <span className="laba-logo">🎬</span>
            <span className="laba-name">LabaFilm</span>
          </div>
          <form className="laba-search" onSubmit={handleSearch}>
            <input
              placeholder="Search movies..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </div>

      {/* Section tabs */}
      <div className="laba-tabs">
        {([
          ["featured",   "Featured"],
          ["latest",     "Latest"],
          ["popular",    "Popular"],
          ["all",        "All Movies"],
          ["series",     "Series"],
          ["series-all", "All Series"],
        ] as [Section, string][]).map(([s, label]) => (
          <button
            key={s}
            className={`laba-tab ${section === s ? "active" : ""}`}
            onClick={() => { setSection(s); setSearch(""); setSearchInput(""); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="laba-spinner-wrap"><span className="laba-spinner" /></div>
      ) : (section === "series" || section === "series-all") ? (
        <div className="laba-grid">
          {series.map(s => (
            <div key={s._id} className="laba-card">
              <div className="laba-poster-wrap">
                <img className="laba-poster" src={s.poster} alt={s.title} loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/300x450/1a1a25/666?text=No+Image"; }} />
                <span className="laba-badge">S{s.latestSeason} E{s.latestEpisode}</span>
              </div>
              <div className="laba-info">
                <p className="laba-title">{s.title}</p>
                <p className="laba-meta">{new Date(s.first_air_date).getFullYear()} · {s.vj}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="laba-grid">
          {movies.map(m => (
            <div key={m._id} className="laba-card" onClick={() => openMovie(m)}>
              <div className="laba-poster-wrap">
                <img className="laba-poster" src={m.poster} alt={m.title} loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/300x450/1a1a25/666?text=No+Image"; }} />
                {m.rating != null && <span className="laba-rating">★ {m.rating.toFixed(1)}</span>}
              </div>
              <div className="laba-info">
                <p className="laba-title">{m.title}</p>
                <p className="laba-meta">{m.release_date ? new Date(m.release_date).getFullYear() : ""} · {m.vj}</p>
              </div>
            </div>
          ))}
          {!loading && movies.length === 0 && (
            <p className="laba-empty">No results found.</p>
          )}
        </div>
      )}

      {/* Movie modal */}
      {(selected || modalLoading) && (
        <div className="laba-overlay" onClick={closeModal}>
          <div className="laba-modal" onClick={e => e.stopPropagation()}>
            <button className="laba-close" onClick={closeModal}>✕</button>

            {modalLoading ? (
              <div className="laba-spinner-wrap"><span className="laba-spinner" /></div>
            ) : selected && (
              <>
                {/* Poster with watch overlay */}
                <div className="laba-poster-hero">
                  <img src={selected.poster} alt={selected.title} className="laba-modal-poster" />
                  <a
                    href={`https://www.labafilm.com/movie/${selected._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="laba-watch-btn"
                  >
                    ▶ Watch on LabaFilm
                  </a>
                </div>

                {/* Info */}
                <div className="laba-modal-info">
                  <h2>{selected.title}</h2>
                  <div className="laba-tags">
                    {selected.release_date && <span>{new Date(selected.release_date).getFullYear()}</span>}
                    {selected.rating > 0 && <span>★ {selected.rating.toFixed(1)}</span>}
                    {selected.vj && <span>{selected.vj}</span>}
                    {selected.director && <span>Dir: {selected.director}</span>}
                    {selected.country && <span>{selected.country}</span>}
                    {(selected.genres ?? []).map(g => <span key={g}>{g}</span>)}
                  </div>
                  {selected.overview && <p className="laba-overview">{selected.overview}</p>}

                  {/* Video URL note */}
                  {selected.video && (
                    <div className="laba-video-url">
                      <span>Video URL</span>
                      <code>{selected.video}</code>
                      <button onClick={() => navigator.clipboard.writeText(selected.video)}>Copy</button>
                    </div>
                  )}
                  <p className="laba-note">Videos are Cloudflare-protected and can only be played on labafilm.com</p>

                  {/* Similar */}
                  {similar.length > 0 && (
                    <div className="laba-similar">
                      <h3>Similar Movies</h3>
                      <div className="laba-similar-grid">
                        {similar.map(s => (
                          <div key={s._id} className="laba-similar-card" onClick={() => openMovie(s)}>
                            <img src={s.poster} alt={s.title}
                              onError={e => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/100x150/1a1a25/666?text=N/A"; }} />
                            <p>{s.title}</p>
                          </div>
                        ))}
                      </div>
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
