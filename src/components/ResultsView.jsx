import { useEffect, useState } from "react";

const SORT_OPTIONS = [
  { value: "mostLoved", label: "Loved" },
  { value: "mostVoted", label: "Voted" },
  { value: "mostDivisive", label: "Divisive" },
  { value: "alphabetical", label: "A-Z" },
];

export default function ResultsView({ fetchResults }) {
  const [sort, setSort] = useState("mostLoved");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadResults() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchResults(sort);

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

    loadResults();

    return () => {
      ignore = true;
    };
  }, [fetchResults, sort]);

  return (
    <section className="list-view">
      <div className="segmented-control" aria-label="Sort results">
        {SORT_OPTIONS.map((option) => (
          <button
            className={sort === option.value ? "active" : ""}
            key={option.value}
            onClick={() => setSort(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <div className="panel-state">Loading results...</div>}
      {error && <div className="panel-state error-state">{error}</div>}

      {!loading && !error && (
        <div className="result-list">
          {results.map((item) => (
            <article className="list-item" key={item.itemId}>
              <img alt={item.title} src={item.imageUrl} />
              <div>
                <h2>{item.title}</h2>
                <p>
                  {item.yesCount} watch / {item.noCount} skip
                </p>
                <div className="meter" aria-label={`${item.yesRate}% watch rate`}>
                  <span style={{ width: `${Math.min(item.yesRate, 100)}%` }} />
                </div>
              </div>
              <strong>{item.yesRate}%</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
