function truncateDescription(description) {
  if (!description) {
    return "No synopsis available.";
  }

  return description.length > 210
    ? `${description.slice(0, 207).trim()}...`
    : description;
}

export default function SwipeCard({
  item,
  progressCurrent,
  progressTotal,
  onSkip,
  onWatch,
  pending,
}) {
  return (
    <article className="swipe-card">
      <div className="progress-row">
        <span>
          {progressCurrent} / {progressTotal}
        </span>
        <span>{item.type || "Anime"}</span>
      </div>

      <div className="poster-frame">
        {item.imageUrl ? (
          <img alt={item.title} src={item.imageUrl} />
        ) : (
          <div className="poster-placeholder">AniSwipe</div>
        )}
      </div>

      <div className="card-copy">
        <h2>{item.title}</h2>
        <div className="meta-row">
          {item.score !== null && item.score !== undefined && (
            <span>Score {item.score}</span>
          )}
          {item.rank !== null && item.rank !== undefined && (
            <span>Rank #{item.rank}</span>
          )}
          {item.episodes !== null && item.episodes !== undefined && (
            <span>{item.episodes} eps</span>
          )}
        </div>
        <p>{truncateDescription(item.description)}</p>
      </div>

      <div className="vote-actions">
        <button
          className="secondary-button"
          disabled={pending}
          onClick={onSkip}
          type="button"
        >
          Skip
        </button>
        <button
          className="primary-button"
          disabled={pending}
          onClick={onWatch}
          type="button"
        >
          Watch
        </button>
      </div>
    </article>
  );
}
