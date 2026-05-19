import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./src/db.js";
import { allowedAnimeTypeFilter } from "./src/animeTypes.js";
import Item from "./src/models/Item.js";
import User from "./src/models/User.js";
import Vote from "./src/models/Vote.js";

dotenv.config();

const DEFAULT_USER_COUNT = 12;
const USER_COUNT = Number(process.env.DEMO_USER_COUNT || DEFAULT_USER_COUNT);

function hashNumber(value) {
  const raw = Math.sin(value) * 10000;
  return raw - Math.floor(raw);
}

function usernameFor(index) {
  return `demo_user_${String(index + 1).padStart(2, "0")}`;
}

function targetVoteCount(totalItems, userIndex) {
  const voteRate = 0.35 + ((userIndex * 7) % 6) * 0.08;
  return Math.max(1, Math.min(totalItems, Math.round(totalItems * voteRate)));
}

function chooseItemsForUser(items, userIndex) {
  return [...items]
    .map((item) => ({
      item,
      sortValue: hashNumber(item.itemId * 97 + userIndex * 193),
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
    .slice(0, targetVoteCount(items.length, userIndex))
    .map(({ item }) => item);
}

function chooseVote(item, userIndex) {
  const tasteSignal = hashNumber(item.itemId * 131 + userIndex * 271);
  const userBias = 0.48 + (userIndex % 5) * 0.06;
  const scoreBoost = item.score >= 8.5 ? 0.12 : item.score <= 7 ? -0.08 : 0;
  const yesThreshold = Math.max(0.25, Math.min(0.85, userBias + scoreBoost));

  return tasteSignal <= yesThreshold ? "yes" : "no";
}

async function upsertDemoUser(username) {
  return User.findOneAndUpdate(
    { username },
    { $setOnInsert: { username } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function seedDemoVotes() {
  await connectDB();

  const items = await Item.find(allowedAnimeTypeFilter())
    .sort({ rank: 1, title: 1 })
    .lean();

  if (items.length === 0) {
    console.log("No allowed anime items found. Run npm run seed first.");
    return;
  }

  let totalVotesUpserted = 0;

  for (let userIndex = 0; userIndex < USER_COUNT; userIndex += 1) {
    const username = usernameFor(userIndex);
    const user = await upsertDemoUser(username);
    const votedItems = chooseItemsForUser(items, userIndex);

    const operations = votedItems.map((item, voteIndex) => ({
      updateOne: {
        filter: { userId: user._id, itemId: item._id },
        update: {
          $set: {
            choice: chooseVote(item, userIndex),
            decisionMs: 700 + ((userIndex + voteIndex) % 15) * 110,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Vote.bulkWrite(operations, { ordered: false });
      totalVotesUpserted += operations.length;
    }

    console.log(`Seeded ${operations.length} votes for ${username}.`);
  }

  console.log(
    `Seeded ${USER_COUNT} demo users with ${totalVotesUpserted} total vote upserts.`
  );
}

seedDemoVotes()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
