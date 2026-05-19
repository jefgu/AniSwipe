import { useEffect, useMemo, useState } from "react";

const SORT_OPTIONS = [
  { value: "mostLoved", label: "Most loved" },
  { value: "mostVoted", label: "Most voted" },
  { value: "mostDivisive", label: "Most divisive" },
  { value: "alphabetical", label: "Alphabetical" },
];

const POLL_INTERVAL_MS = 5000;

function formatPercent(value) {
  const rate = Number(value || 0);
  return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;
}

function formatValue(value, fallback = "Unknown") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

export default function ResultsView({ fetchResults }) {
  const [selectedSort, setSelectedSort] = useState("mostLoved");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedItemId, setExpandedItemId] = useState(null);

  const visibleResults = useMemo(() => {
    if (selectedSort !== "mostDivisive") {
      return results;
    }

    return [...results].sort(
      (a, b) =>
        Math.abs(a.yesRate - 50) - Math.abs(b.yesRate - 50) ||
        b.totalVotes - a.totalVotes ||
        a.title.localeCompare(b.title)
    );
  }, [results, selectedSort]);

  useEffect(() => {
    let ignore = false;

    async function loadResults(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      try {
        const data = await fetchResults(selectedSort);

        if (!ignore) {
          setResults(data.results || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadResults(true);
    const intervalId = window.setInterval(() => loadResults(false), POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [fetchResults, selectedSort]);

  return (
    <section className="list-view">
      <div className="results-toolbar">
        <label htmlFor="results-sort">Sort results</label>
        <select
          className="sort-select"
          id="results-sort"
          onChange={(event) => setSelectedSort(event.target.value)}
          value={selectedSort}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="panel-state">Loading results...</div>}
      {error && <div className="panel-state error-state">{error}</div>}

      {!loading && !error && visibleResults.length === 0 && (
        <div className="panel-state">No results yet.</div>
      )}

      {!loading && !error && visibleResults.length > 0 && (
        <div className="result-list">
          {visibleResults.map((item) => (
            <article
              className={`list-item result-item ${
                expandedItemId === item.itemId ? "expanded" : ""
              }`}
              key={item.itemId}
            >
              {item.imageUrl ? (
                <img alt={item.title} src={item.imageUrl} />
              ) : (
                <div className="result-thumbnail-placeholder" aria-hidden="true" />
              )}

              <div className="result-copy">
                <h2>{item.title}</h2>
                <div className="result-stats">
                  <span>{item.yesCount} watch</span>
                  <span>{item.noCount} skip</span>
                  <span>{item.totalVotes} total</span>
                </div>
                <button
                  aria-expanded={expandedItemId === item.itemId}
                  className="result-toggle"
                  onClick={() =>
                    setExpandedItemId((currentId) =>
                      currentId === item.itemId ? null : item.itemId
                    )
                  }
                  type="button"
                >
                  {expandedItemId === item.itemId ? "Hide details" : "Details"}
                </button>
                <div
                  className="meter"
                  aria-label={`${formatPercent(item.yesRate)} watch rate`}
                >
                  <span style={{ width: `${Math.min(item.yesRate, 100)}%` }} />
                </div>
              </div>

              <strong className="result-percentage">
                {formatPercent(item.yesRate)}
              </strong>

              {expandedItemId === item.itemId && (
                <div className="item-details">
                  <p>{item.description || "No synopsis available."}</p>
                  <div className="detail-grid">
                    <span>Type</span>
                    <strong>{formatValue(item.type)}</strong>
                    <span>Episodes</span>
                    <strong>{formatValue(item.episodes)}</strong>
                    <span>Score</span>
                    <strong>{formatValue(item.score)}</strong>
                    <span>Rank</span>
                    <strong>
                      {item.rank === null || item.rank === undefined
                        ? "Unknown"
                        : `#${item.rank}`}
                    </strong>
                  </div>
                  {item.sourceUrl && (
                    <a
                      className="source-link"
                      href={item.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View source
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
