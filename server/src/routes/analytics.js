import express from "express";

import SwipeEvent from "../models/SwipeEvent.js";

const router = express.Router();

function roundNumber(value, decimals = 0) {
  if (value === null || value === undefined) {
    return null;
  }

  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

router.get("/", async (req, res, next) => {
  try {
    const [summary = {}, sessionUserIds] = await Promise.all([
      SwipeEvent.aggregate([
        {
          $group: {
            _id: null,
            totalSwipes: { $sum: 1 },
            watchSwipes: {
              $sum: {
                $cond: [{ $eq: ["$choice", "yes"] }, 1, 0],
              },
            },
            skipSwipes: {
              $sum: {
                $cond: [{ $eq: ["$choice", "no"] }, 1, 0],
              },
            },
            averageDecisionMs: { $avg: "$decisionMs" },
            decisionSamples: {
              $sum: {
                $cond: [{ $ne: ["$decisionMs", null] }, 1, 0],
              },
            },
          },
        },
      ]).then((rows) => rows[0]),
      SwipeEvent.distinct("userId"),
    ]);

    const averageDecisionMs = roundNumber(summary.averageDecisionMs);

    return res.json({
      analytics: {
        totalSwipes: summary.totalSwipes || 0,
        sessions: sessionUserIds.length,
        averageDecisionMs,
        averageDecisionSeconds:
          averageDecisionMs === null ? null : roundNumber(averageDecisionMs / 1000, 1),
        watchSwipes: summary.watchSwipes || 0,
        skipSwipes: summary.skipSwipes || 0,
        decisionSamples: summary.decisionSamples || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
