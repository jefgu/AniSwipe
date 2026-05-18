import { useEffect, useState } from "react";

function formatPercent(value) {
  const rate = Number(value || 0);
  return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;
}

function shortDescription(description) {
  if (!description) {
    return "No synopsis available.";
  }

  return description.length > 130
    ? `${description.slice(0, 127).trim()}...`
    : description;
}

export default function MatchesView({ userId, fetchMatches }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            <article className="list-item result-item match-item" key={item.itemId}>
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
                </div>
                <p className="match-description">
                  {shortDescription(item.description)}
                </p>
              </div>

              <strong className="result-percentage">
                {formatPercent(item.yesRate)}
              </strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
