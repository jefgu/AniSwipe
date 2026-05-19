import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./src/db.js";
import { allowedAnimeTypeFilter } from "./src/animeTypes.js";
import Item from "./src/models/Item.js";
import User from "./src/models/User.js";
import Vote from "./src/models/Vote.js";

dotenv.config();

const DEMO_USERNAME = "end";

function chooseDemoVote(item) {
  // Deterministic mix: enough "yes" votes to create matches, with some "no" votes
  // so aggregate results are more interesting than a perfect 100%.
  return item.itemId % 5 === 0 ? "no" : "yes";
}

async function seedEndUserVotes() {
  await connectDB();

  const user = await User.findOneAndUpdate(
    { username: DEMO_USERNAME },
    { $setOnInsert: { username: DEMO_USERNAME } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const items = await Item.find(allowedAnimeTypeFilter())
    .sort({ rank: 1, title: 1 })
    .lean();

  if (items.length === 0) {
    console.log("No allowed anime items found. Run npm run seed first.");
    return;
  }

  const operations = items.map((item, index) => ({
    updateOne: {
      filter: { userId: user._id, itemId: item._id },
      update: {
        $set: {
          choice: chooseDemoVote(item),
          decisionMs: 600 + (index % 12) * 125,
        },
      },
      upsert: true,
    },
  }));

  await Vote.bulkWrite(operations, { ordered: false });

  const endUserVoteCount = await Vote.countDocuments({ userId: user._id });

  console.log(`Seeded demo user "${user.username}" (${user._id}).`);
  console.log(`Upserted votes for ${items.length} allowed anime items.`);
  console.log(`"${user.username}" now has ${endUserVoteCount} total votes.`);
}

seedEndUserVotes()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
