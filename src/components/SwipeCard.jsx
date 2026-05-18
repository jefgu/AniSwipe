import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from "motion/react";

const SWIPE_THRESHOLD = 120;
const MIN_EXIT_DISTANCE = 620;

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
  const controls = useAnimationControls();
  const [isExiting, setIsExiting] = useState(false);
  const rotate = useTransform(x, [-180, 0, 180], [-8, 0, 8]);
  const watchOpacity = useTransform(x, [24, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, -24], [1, 0]);
  const isLocked = pending || isExiting;

  useEffect(() => {
    setIsExiting(false);
    x.set(0);
    controls.set({ opacity: 0, scale: 0.98 });
    controls.start({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    });
  }, [controls, item.itemId, x]);

  function getExitDistance() {
    return Math.max(window.innerWidth + 220, MIN_EXIT_DISTANCE);
  }

  async function animateX(to, transition) {
    const playback = animate(x, to, transition);

    if (typeof playback?.then === "function") {
      await playback;
      return;
    }

    if (playback?.finished) {
      await playback.finished;
    }
  }

  async function animateVote(choice, direction) {
    if (isLocked) {
      return;
    }

    setIsExiting(true);

    await Promise.all([
      animateX(direction * getExitDistance(), {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }),
      controls.start({
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      }),
    ]);

    const didVote = await onVote(choice, item.itemId);

    if (didVote === false) {
      await Promise.all([
        animateX(0, { type: "spring", stiffness: 360, damping: 32 }),
        controls.start({
          opacity: 1,
          scale: 1,
          transition: { type: "spring", stiffness: 360, damping: 32 },
        }),
      ]);
      setIsExiting(false);
    }
  }

  function handleDragEnd(_event, info) {
    if (isLocked) {
      return;
    }

    if (info.offset.x > SWIPE_THRESHOLD) {
      animateVote("yes", 1);
      return;
    }

    if (info.offset.x < -SWIPE_THRESHOLD) {
      animateVote("no", -1);
      return;
    }

    animateX(0, { type: "spring", stiffness: 420, damping: 34 });
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
        animate={controls}
        className="swipe-card"
        drag={isLocked ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.82}
        initial={{ opacity: 0, scale: 0.98 }}
        onDragEnd={handleDragEnd}
        style={{ x, rotate }}
        whileTap={isLocked ? undefined : { scale: 0.985 }}
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
            disabled={isLocked}
            onClick={() => animateVote("no", -1)}
            type="button"
          >
            Skip
          </button>
          <button
            className="primary-button"
            disabled={isLocked}
            onClick={() => animateVote("yes", 1)}
            type="button"
          >
            Watch
          </button>
        </div>
      </motion.article>
    </div>
  );
}
