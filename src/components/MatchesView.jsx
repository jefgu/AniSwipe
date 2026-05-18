import { useEffect, useState } from "react";

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
        <div className="panel-state">No matches yet.</div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="result-list">
          {matches.map((item) => (
            <article className="list-item" key={item.itemId}>
              <img alt={item.title} src={item.imageUrl} />
              <div>
                <h2>{item.title}</h2>
                <p>
                  {item.yesRate}% watch rate · {item.totalVotes} votes
                </p>
              </div>
              <strong>Match</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
