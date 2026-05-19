import { useEffect, useState } from "react";

function formatPercent(value) {
  const rate = Number(value || 0);
  return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;
}

function formatValue(value, fallback = "Unknown") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

export default function MatchesView({ userId, fetchMatches }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedItemId, setExpandedItemId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadMatches() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchMatches(userId);

        if (!ignore) {
          setMatches(data.matches || []);
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

    loadMatches();

    return () => {
      ignore = true;
    };
  }, [fetchMatches, userId]);

  return (
    <section className="list-view">
      {loading && <div className="panel-state">Loading matches...</div>}
      {error && <div className="panel-state error-state">{error}</div>}

      {!loading && !error && matches.length === 0 && (
        <div className="panel-state">
          No matches yet. Vote yes on more anime and check back.
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="result-list">
          {matches.map((item) => (
            <article
              className={`list-item result-item match-item ${
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
