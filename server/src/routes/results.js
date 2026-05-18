import express from "express";

import { allowedAnimeTypeFilter } from "../animeTypes.js";
import Item from "../models/Item.js";
import Vote from "../models/Vote.js";

const router = express.Router();
const SORTS = new Set([
  "mostLoved",
  "mostVoted",
  "mostDivisive",
  "alphabetical",
]);

function sortResults(results, sort) {
  const byTitle = (a, b) => a.title.localeCompare(b.title);

  if (sort === "alphabetical") {
    return results.sort(byTitle);
  }

  if (sort === "mostVoted") {
    return results.sort(
      (a, b) => b.totalVotes - a.totalVotes || b.yesRate - a.yesRate || byTitle(a, b)
    );
  }

  if (sort === "mostDivisive") {
    return results.sort(
      (a, b) =>
        b.divisiveness - a.divisiveness ||
        b.totalVotes - a.totalVotes ||
        byTitle(a, b)
    );
  }

  return results.sort(
    (a, b) => b.yesRate - a.yesRate || b.totalVotes - a.totalVotes || byTitle(a, b)
  );
}

router.get("/", async (req, res, next) => {
  try {
    const sort = req.query.sort || "mostLoved";

    if (!SORTS.has(sort)) {
      return res.status(400).json({
        error:
          "Invalid sort. Use mostLoved, mostVoted, mostDivisive, or alphabetical.",
      });
    }

    const [items, voteCounts] = await Promise.all([
      Item.find(allowedAnimeTypeFilter()).lean(),
      Vote.aggregate([
        {
          $group: {
            _id: "$itemId",
            yesCount: {
              $sum: {
                $cond: [{ $eq: ["$choice", "yes"] }, 1, 0],
              },
            },
            noCount: {
              $sum: {
                $cond: [{ $eq: ["$choice", "no"] }, 1, 0],
              },
            },
            totalVotes: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countsByItemId = new Map(
      voteCounts.map((counts) => [counts._id.toString(), counts])
    );

    const results = items.map((item) => {
      const counts = countsByItemId.get(item._id.toString()) || {
        yesCount: 0,
        noCount: 0,
        totalVotes: 0,
      };
      const yesRate =
        counts.totalVotes === 0
          ? 0
          : Math.round((counts.yesCount / counts.totalVotes) * 1000) / 10;
      const yesFraction = counts.totalVotes === 0 ? 0 : yesRate / 100;

      return {
        _id: item._id.toString(),
        itemId: item.itemId,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        sourceUrl: item.sourceUrl,
        rank: item.rank,
        score: item.score,
        type: item.type,
        episodes: item.episodes,
        yesCount: counts.yesCount,
        noCount: counts.noCount,
        totalVotes: counts.totalVotes,
        yesRate,
        divisiveness:
          counts.totalVotes === 0 ? -1 : 1 - Math.abs(0.5 - yesFraction) * 2,
      };
    });

    const sortedResults = sortResults(results, sort).map(
      ({ divisiveness, ...result }) => result
    );

    return res.json({
      sort,
      results: sortedResults,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
