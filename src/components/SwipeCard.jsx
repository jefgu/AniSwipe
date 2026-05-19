import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from "motion/react";

import AnimeImage from "./AnimeImage.jsx";

const SWIPE_THRESHOLD = 120;
const MIN_EXIT_DISTANCE = 620;
const DEFAULT_EXIT_DURATION = 1.6;
const MIN_EXIT_DURATION = 1;
const MAX_EXIT_DURATION = 1.6;
const FAST_SWIPE_VELOCITY = 1600;

function truncateDescription(description) {
  if (!description) {
    return "No synopsis available.";
  }

  return description.length > 210
    ? `${description.slice(0, 207).trim()}...`
    : description;
}

function canExpandDescription(description) {
  return Boolean(description && description.length > 210);
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const rotate = useTransform(x, [-180, 0, 180], [-8, 0, 8]);
  const watchOpacity = useTransform(x, [24, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, -24], [1, 0]);
  const isLocked = pending || isExiting;

  useEffect(() => {
    setIsExiting(false);
    setIsDescriptionExpanded(false);
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

  function getExitDuration(releaseVelocityX) {
    if (!Number.isFinite(releaseVelocityX)) {
      return DEFAULT_EXIT_DURATION;
    }

    const speed = Math.min(Math.abs(releaseVelocityX), FAST_SWIPE_VELOCITY);
    const progress = speed / FAST_SWIPE_VELOCITY;

    return MAX_EXIT_DURATION - (MAX_EXIT_DURATION - MIN_EXIT_DURATION) * progress;
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

  async function animateVote(choice, direction, releaseVelocityX) {
    if (isLocked) {
      return;
    }

    setIsExiting(true);
    const exitDuration = getExitDuration(releaseVelocityX);

    await Promise.all([
      animateX(direction * getExitDistance(), {
        duration: exitDuration,
        ease: [0.22, 1, 0.36, 1],
      }),
      controls.start({
        opacity: 0,
        scale: 0.96,
        transition: { duration: exitDuration, ease: [0.22, 1, 0.36, 1] },
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

    const releaseVelocityX = info?.velocity?.x ?? 0;

    if (info.offset.x > SWIPE_THRESHOLD) {
      animateVote("yes", 1, releaseVelocityX);
      return;
    }

    if (info.offset.x < -SWIPE_THRESHOLD) {
      animateVote("no", -1, releaseVelocityX);
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
        dragMomentum={false}
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
          <AnimeImage alt={item.title} src={item.imageUrl} variant="poster" />
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
          <p className={isDescriptionExpanded ? "expanded" : ""}>
            {isDescriptionExpanded
              ? item.description || "No synopsis available."
              : truncateDescription(item.description)}
          </p>
          {canExpandDescription(item.description) && (
            <button
              aria-expanded={isDescriptionExpanded}
              className="description-toggle"
              onClick={() =>
                setIsDescriptionExpanded((isExpanded) => !isExpanded)
              }
              type="button"
            >
              {isDescriptionExpanded ? "Show less" : "Show more"}
            </button>
          )}
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
