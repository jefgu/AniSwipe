import express from "express";
import mongoose from "mongoose";

import { allowedAnimeTypeFilter } from "../animeTypes.js";
import Item from "../models/Item.js";
import Vote from "../models/Vote.js";

const router = express.Router();

function serializeItem(item, userVote = null) {
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
    userVote,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const items = await Item.find(allowedAnimeTypeFilter())
      .sort({ rank: 1, title: 1 })
      .lean();
    const voteByItemId = new Map();

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
      }

      const votes = await Vote.find({
        userId,
        itemId: { $in: items.map((item) => item._id) },
      }).lean();

      for (const vote of votes) {
        voteByItemId.set(vote.itemId.toString(), vote.choice);
      }
    }

    return res.json({
      items: items.map((item) =>
        serializeItem(item, voteByItemId.get(item._id.toString()) || null)
      ),
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
