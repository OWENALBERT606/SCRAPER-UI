import { useState, useEffect } from "react";
import { scrapeUrl, getCachedUrls, getCachedData, clearCache } from "./api";
import type { ScrapeResult, Selector } from "./types";
import TulabeMovies from "./TulabeMovies";
import LabafilmMovies from "./LabafilmMovies";
import "./App.css";

type View = "tulabe" | "labafilm" | "scraper";

const NAV: { id: View; label: string; color: string }[] = [
  { id: "tulabe",   label: "Tulabe",   color: "#7c6af7" },
  { id: "labafilm", label: "LabaFilm", color: "#e53e3e" },
  { id: "scraper",  label: "Scraper",  color: "#4a9eff" },
];

function NavBar({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <nav style={{ background: "#0d0d14", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", padding: "0 24px", gap: 4 }}>
      {NAV.map(n => (
        <button
          key={n.id}
          onClick={() => setView(n.id)}
          style={{
            background: view === n.id ? n.color : "transparent",
            border: "none",
            color: view === n.id ? "#fff" : "#888",
            padding: "16px 20px",
            cursor: "pointer",
            fontWeight: view === n.id ? 700 : 400,
            fontSize: 14,
            borderBottom: view === n.id ? `2px solid ${n.color}` : "2px solid transparent",
            marginBottom: -1,
            transition: "all 0.15s",
          }}
        >
          {n.label}
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [view, setView] = useState<View>("tulabe");

  if (view === "tulabe")   return <><NavBar view={view} setView={setView} /><TulabeMovies /></>;
  if (view === "labafilm") return <><NavBar view={view} setView={setView} /><LabafilmMovies /></>;
  const [url, setUrl] = useState("");
  const [waitFor, setWaitFor] = useState("");
  const [selectors, setSelectors] = useState<Selector[]>([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [cachedUrls, setCachedUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"text" | "links" | "images" | "custom" | "raw">("text");
  const [showSelectors, setShowSelectors] = useState(false);

  useEffect(() => { loadCache(); }, []);

  async function loadCache() {
    const data = await getCachedUrls();
    setCachedUrls(data.urls);
  }

  async function handleScrape() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectorMap: Record<string, string> = {};
    selectors.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) selectorMap[key.trim()] = value.trim();
    });

    const res = await scrapeUrl(url.trim(), selectorMap, waitFor);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
      loadCache();
    } else {
      setError(res.error ?? "Scraping failed");
    }
  }

  async function handleLoadCached(cachedUrl: string) {
    setLoading(true);
    setError("");
    const res = await getCachedData(cachedUrl);
    setLoading(false);
    if (res.success) {
      setUrl(cachedUrl);
      setResult(res.data);
    }
  }

  async function handleClearAll() {
    await clearCache();
    setCachedUrls([]);
    setResult(null);
  }

  function addSelector() {
    setSelectors((s) => [...s, { key: "", value: "" }]);
  }

  function updateSelector(index: number, field: "key" | "value", val: string) {
    setSelectors((s) => s.map((item, i) => (i === index ? { ...item, [field]: val } : item)));
  }

  function removeSelector(index: number) {
    setSelectors((s) => s.filter((_, i) => i !== index));
  }

  return (
    <div className="app">
      <NavBar view={view} setView={setView} />
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◎</span>
            <span className="logo-text">ScraperAPI</span>
          </div>
          <span className="badge">Playwright · TypeScript</span>
        </div>
      </header>

      <main className="main">
        <section className="card input-card">
          <div className="url-row">
            <input
              className="url-input"
              type="text"
              placeholder="https://your-react-or-vue-site.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
            />
            <button className="btn-primary" onClick={handleScrape} disabled={loading || !url.trim()}>
              {loading ? <span className="spinner" /> : "Scrape"}
            </button>
          </div>

          <button className="toggle-btn" onClick={() => setShowSelectors((v) => !v)}>
            {showSelectors ? "▲ Hide" : "▼ Advanced"} options
          </button>

          {showSelectors && (
            <div className="advanced">
              <div className="field-group">
                <label>
                  Wait for selector
                  <span className="hint"> — CSS selector to wait for before extracting</span>
                </label>
                <input
                  type="text"
                  placeholder=".product-list, #app, [data-loaded]"
                  value={waitFor}
                  onChange={(e) => setWaitFor(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>
                  Custom selectors
                  <span className="hint"> — extract specific elements by CSS selector</span>
                </label>
                {selectors.map((s, i) => (
                  <div className="selector-row" key={i}>
                    <input
                      placeholder="key (e.g. price)"
                      value={s.key}
                      onChange={(e) => updateSelector(i, "key", e.target.value)}
                    />
                    <input
                      placeholder="selector (e.g. .price-tag)"
                      value={s.value}
                      onChange={(e) => updateSelector(i, "value", e.target.value)}
                    />
                    {selectors.length > 1 && (
                      <button className="remove-btn" onClick={() => removeSelector(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button className="add-btn" onClick={addSelector}>+ Add selector</button>
              </div>
            </div>
          )}
        </section>

        {error && <div className="error-banner">{error}</div>}

        <div className="content-grid">
          {result && (
            <section className="card result-card">
              <div className="result-header">
                <div>
                  <h2 className="result-title">{result.page.title || "Untitled"}</h2>
                  <p className="result-url">{result.url}</p>
                  {result.page.description && (
                    <p className="result-desc">{result.page.description}</p>
                  )}
                </div>
                <span className="scraped-at">{new Date(result.scrapedAt).toLocaleTimeString()}</span>
              </div>

              <div className="stats-row">
                <span className="stat">{result.text.headings.length} headings</span>
                <span className="stat">{result.text.paragraphs.length} paragraphs</span>
                <span className="stat">{result.text.links.length} links</span>
                <span className="stat">{result.text.images.length} images</span>
              </div>

              <div className="tabs">
                {(["text", "links", "images", "custom", "raw"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "custom" ? `custom (${Object.keys(result.custom).length})` : tab}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {activeTab === "text" && (
                  <div>
                    {result.text.headings.length > 0 && (
                      <div className="section">
                        <h3>Headings</h3>
                        <ul>{result.text.headings.map((h, i) => <li key={i}>{h}</li>)}</ul>
                      </div>
                    )}
                    {result.text.paragraphs.length > 0 && (
                      <div className="section">
                        <h3>Paragraphs</h3>
                        {result.text.paragraphs.map((p, i) => <p key={i} className="para">{p}</p>)}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "links" && (
                  <table className="data-table">
                    <thead><tr><th>Text</th><th>URL</th></tr></thead>
                    <tbody>
                      {result.text.links.map((l, i) => (
                        <tr key={i}>
                          <td>{l.text || "—"}</td>
                          <td><a href={l.href} target="_blank" rel="noreferrer">{l.href}</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "images" && (
                  <div className="image-grid">
                    {result.text.images.length === 0
                      ? <p className="empty">No images found</p>
                      : result.text.images.map((img, i) => (
                        <div className="image-card" key={i}>
                          <img src={img.src} alt={img.alt} onError={(e) => (e.currentTarget.style.display = "none")} />
                          <span>{img.alt || "no alt"}</span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {activeTab === "custom" && (
                  <div>
                    {Object.keys(result.custom).length === 0
                      ? <p className="empty">No custom selectors used. Add them in Advanced options.</p>
                      : Object.entries(result.custom).map(([key, val]) => (
                        <div className="custom-entry" key={key}>
                          <span className="custom-key">{key}</span>
                          <span className="custom-val">{Array.isArray(val) ? val.join(", ") : val}</span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {activeTab === "raw" && (
                  <pre className="raw-json">{JSON.stringify(result, null, 2)}</pre>
                )}
              </div>
            </section>
          )}

          <aside className="card cache-card">
            <div className="cache-header">
              <h3>Cached URLs</h3>
              {cachedUrls.length > 0 && (
                <button className="clear-btn" onClick={handleClearAll}>Clear all</button>
              )}
            </div>
            {cachedUrls.length === 0
              ? <p className="empty">No cached results yet</p>
              : cachedUrls.map((u) => (
                <button key={u} className="cache-item" onClick={() => handleLoadCached(u)}>{u}</button>
              ))
            }
          </aside>
        </div>
      </main>
    </div>
  );
}
