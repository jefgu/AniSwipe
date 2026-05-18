import express from "express";

import User from "../models/User.js";

const router = express.Router();
const USERNAME_PATTERN = /^[a-z0-9_-]{2,30}$/;

router.post("/login", async (req, res, next) => {
  let username = "";

  try {
    username =
      typeof req.body.username === "string"
        ? req.body.username.trim().toLowerCase()
        : "";

    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({
        error:
          "Username is required and must be 2-30 characters: letters, numbers, underscores, or hyphens only.",
      });
    }

    const user = await User.findOneAndUpdate(
      { username },
      { $setOnInsert: { username } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      userId: user._id.toString(),
      username: user.username,
    });
  } catch (err) {
    if (err.code === 11000 && username) {
      const user = await User.findOne({ username });

      if (user) {
        return res.json({
          userId: user._id.toString(),
          username: user.username,
        });
      }
    }

    return next(err);
  }
});

export default router;
