import express from "express";
import mongoose from "mongoose";

import Item from "../models/Item.js";
import User from "../models/User.js";
import Vote from "../models/Vote.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid userId is required" });
    }

    const user = await User.exists({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userYesVotes = await Vote.find({ userId, choice: "yes" }).lean();
    const itemMongoIds = userYesVotes.map((vote) => vote.itemId);

    if (itemMongoIds.length === 0) {
      return res.json({ matches: [] });
    }

    const [items, voteCounts] = await Promise.all([
      Item.find({ _id: { $in: itemMongoIds } }).lean(),
      Vote.aggregate([
        { $match: { itemId: { $in: itemMongoIds } } },
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

    const matches = items
      .map((item) => {
        const counts = countsByItemId.get(item._id.toString()) || {
          yesCount: 0,
          noCount: 0,
          totalVotes: 0,
        };
        const yesRate =
          counts.totalVotes === 0
            ? 0
            : Math.round((counts.yesCount / counts.totalVotes) * 1000) / 10;

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
        };
      })
      .filter((item) => item.yesRate >= 70)
      .sort(
        (a, b) =>
          b.yesRate - a.yesRate ||
          b.totalVotes - a.totalVotes ||
          a.title.localeCompare(b.title)
      );

    return res.json({ matches });
  } catch (err) {
    return next(err);
  }
});

export default router;
