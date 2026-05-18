import express from "express";
import mongoose from "mongoose";

import { isAllowedAnimeType } from "../animeTypes.js";
import Item from "../models/Item.js";
import SwipeEvent from "../models/SwipeEvent.js";
import User from "../models/User.js";
import Vote from "../models/Vote.js";

const router = express.Router();
const VALID_CHOICES = new Set(["yes", "no"]);

async function findItemByApiId(itemId) {
  const numericItemId = Number(itemId);

  if (Number.isInteger(numericItemId)) {
    const itemBySeedId = await Item.findOne({ itemId: numericItemId });

    if (itemBySeedId) {
      return itemBySeedId;
    }
  }

  if (
    typeof itemId === "string" &&
    /^[a-fA-F0-9]{24}$/.test(itemId) &&
    mongoose.Types.ObjectId.isValid(itemId)
  ) {
    const itemByMongoId = await Item.findById(itemId);

    if (itemByMongoId) {
      return itemByMongoId;
    }
  }

  return null;
}

function normalizeDecisionMs(decisionMs) {
  if (decisionMs === undefined || decisionMs === null || decisionMs === "") {
    return null;
  }

  const value = Number(decisionMs);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
}

router.post("/", async (req, res, next) => {
  try {
    const { userId, itemId, choice } = req.body;
    const decisionMs = normalizeDecisionMs(req.body.decisionMs);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid userId is required" });
    }

    if (itemId === undefined || itemId === null || itemId === "") {
      return res.status(400).json({ error: "itemId is required" });
    }

    if (!VALID_CHOICES.has(choice)) {
      return res.status(400).json({ error: 'choice must be "yes" or "no"' });
    }

    if (Number.isNaN(decisionMs)) {
      return res
        .status(400)
        .json({ error: "decisionMs must be a non-negative number" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const item = await findItemByApiId(itemId);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (!isAllowedAnimeType(item.type)) {
      return res.status(400).json({
        error: "This item type is not available for AniSwipe voting",
      });
    }

    const vote = await Vote.findOneAndUpdate(
      { userId: user._id, itemId: item._id },
      {
        $set: {
          choice,
          decisionMs,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await SwipeEvent.create({
      userId: user._id,
      itemId: item._id,
      choice,
      decisionMs,
    });

    return res.json({
      vote: {
        _id: vote._id.toString(),
        userId: vote.userId.toString(),
        itemId: item.itemId,
        itemMongoId: item._id.toString(),
        choice: vote.choice,
        decisionMs: vote.decisionMs,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const { userId, itemId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid userId is required" });
    }

    if (itemId === undefined || itemId === null || itemId === "") {
      return res.status(400).json({ error: "itemId is required" });
    }

    const item = await findItemByApiId(itemId);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const result = await Vote.deleteOne({ userId, itemId: item._id });

    return res.json({
      deleted: result.deletedCount === 1,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
