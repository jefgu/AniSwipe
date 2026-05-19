import { useEffect, useState } from "react";

function formatInteger(value) {
  return Number(value || 0).toLocaleString();
}

function formatDecisionTime(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Number(value).toFixed(1)}s`;
}

export default function AnalyticsView({ fetchAnalytics }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchAnalytics();

        if (!ignore) {
          setAnalytics(data.analytics || null);
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

    loadAnalytics();

    return () => {
      ignore = true;
    };
  }, [fetchAnalytics]);

  if (loading) {
    return <div className="panel-state">Loading analytics...</div>;
  }

  if (error) {
    return <div className="panel-state error-state">{error}</div>;
  }

  if (!analytics) {
    return <div className="panel-state">No analytics yet.</div>;
  }

  const totalSwipes = analytics.totalSwipes || 0;
  const watchRate =
    totalSwipes === 0 ? 0 : Math.round((analytics.watchSwipes / totalSwipes) * 100);
  const skipRate =
    totalSwipes === 0 ? 0 : Math.round((analytics.skipSwipes / totalSwipes) * 100);

  return (
    <section className="analytics-view">
      <div className="analytics-grid">
        <article className="metric-card">
          <span>Total swipes</span>
          <strong>{formatInteger(analytics.totalSwipes)}</strong>
        </article>
        <article className="metric-card">
          <span>Sessions</span>
          <strong>{formatInteger(analytics.sessions)}</strong>
        </article>
        <article className="metric-card">
          <span>Avg decision</span>
          <strong>{formatDecisionTime(analytics.averageDecisionSeconds)}</strong>
        </article>
      </div>

      <div className="analytics-panel">
        <div className="analytics-row">
          <div>
            <span>Watch swipes</span>
            <strong>{formatInteger(analytics.watchSwipes)}</strong>
          </div>
          <span>{watchRate}%</span>
        </div>
        <div className="meter analytics-meter" aria-label={`${watchRate}% watch`}>
          <span style={{ width: `${watchRate}%` }} />
        </div>

        <div className="analytics-row">
          <div>
            <span>Skip swipes</span>
            <strong>{formatInteger(analytics.skipSwipes)}</strong>
          </div>
          <span>{skipRate}%</span>
        </div>
        <div className="meter analytics-meter skip-meter" aria-label={`${skipRate}% skip`}>
          <span style={{ width: `${skipRate}%` }} />
        </div>
      </div>

      <p className="analytics-note">
        Sessions are counted as unique users with at least one swipe event.
      </p>
    </section>
  );
}
