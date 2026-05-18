import { motion, useMotionValue, useTransform } from "motion/react";

const SWIPE_THRESHOLD = 120;

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
  onVote,
  pending,
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 0, 180], [-8, 0, 8]);
  const watchOpacity = useTransform(x, [24, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, -24], [1, 0]);

  function handleDragEnd(_event, info) {
    if (pending) {
      return;
    }

    if (info.offset.x > SWIPE_THRESHOLD) {
      onVote("yes", item.itemId);
      return;
    }

    if (info.offset.x < -SWIPE_THRESHOLD) {
      onVote("no", item.itemId);
    }
  }

  return (
    <div className="swipe-card-stage">
      <motion.div
        aria-hidden="true"
        className="swipe-hint watch-hint"
        style={{ opacity: watchOpacity }}
      >
        WATCH
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="swipe-hint skip-hint"
        style={{ opacity: skipOpacity }}
      >
        SKIP
      </motion.div>

      <motion.article
        className="swipe-card"
        drag={pending ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.82}
        onDragEnd={handleDragEnd}
        style={{ x, rotate }}
        whileTap={pending ? undefined : { scale: 0.985 }}
      >
        <div className="progress-row">
          <span>
            {progressCurrent} / {progressTotal}
          </span>
          <span>{item.type || "Anime"}</span>
        </div>

        <div className="poster-frame">
          {item.imageUrl ? (
            <img
              alt={item.title}
              draggable="false"
              onDragStart={(event) => event.preventDefault()}
              src={item.imageUrl}
            />
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
            onClick={() => onVote("no", item.itemId)}
            type="button"
          >
            Skip
          </button>
          <button
            className="primary-button"
            disabled={pending}
            onClick={() => onVote("yes", item.itemId)}
            type="button"
          >
            Watch
          </button>
        </div>
      </motion.article>
    </div>
  );
}
