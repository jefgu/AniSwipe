import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./src/db.js";
import {
  allowedAnimeTypeFilter,
  isAllowedAnimeType,
} from "./src/animeTypes.js";
import Item from "./src/models/Item.js";

dotenv.config();

const TARGET_COUNT = Number(process.env.SEED_TARGET || 120);
const PAGE_LIMIT = 25;
const JIKAN_BASE_URL = "https://api.jikan.moe/v4/top/anime";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAnime(anime) {
  return {
    itemId: anime.mal_id,
    title: anime.title_english || anime.title,
    description: anime.synopsis || "",
    imageUrl:
      anime.images?.webp?.large_image_url ||
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      "",
    sourceUrl: anime.url || `https://myanimelist.net/anime/${anime.mal_id}`,
    rank: anime.rank ?? null,
    score: anime.score ?? null,
    type: anime.type || "",
    episodes: anime.episodes ?? null,
  };
}

async function fetchTopAnimePage(page) {
  const url = `${JIKAN_BASE_URL}?page=${page}&limit=${PAGE_LIMIT}`;
  const response = await fetch(url);

  if (response.status === 429) {
    console.log("Jikan rate limit hit. Waiting before retrying...");
    await sleep(2500);
    return fetchTopAnimePage(page);
  }

  if (!response.ok) {
    throw new Error(`Jikan request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function seedAnime() {
  await connectDB();

  const seenItemIds = new Set();
  let page = 1;

  while (seenItemIds.size < TARGET_COUNT) {
    console.log(`Fetching Jikan top anime page ${page}...`);
    const payload = await fetchTopAnimePage(page);
    const animeList = payload.data || [];

    if (animeList.length === 0) {
      break;
    }

    for (const anime of animeList) {
      const item = normalizeAnime(anime);

      if (!item.itemId || !item.title) {
        continue;
      }

      if (!isAllowedAnimeType(item.type)) {
        continue;
      }

      await Item.findOneAndUpdate(
        { itemId: item.itemId },
        { $set: item },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      seenItemIds.add(item.itemId);

      if (seenItemIds.size >= TARGET_COUNT) {
        break;
      }
    }

    page += 1;
    await sleep(800);
  }

  const totalItems = await Item.countDocuments(allowedAnimeTypeFilter());
  console.log(`Seed complete. Saved ${seenItemIds.size} anime this run.`);
  console.log(`Database now contains ${totalItems} allowed anime items.`);
}

seedAnime()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
