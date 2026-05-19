# AniSwipe

AniSwipe is a mobile-first anime voting app. Users log in with a lightweight username, review anime cards, and vote `Watch` or `Skip`. The app stores votes persistently, shows aggregate results, and surfaces matches based on anime the current user liked.

## Theme

The theme is anime discovery. The seeded dataset comes from Jikan, an unofficial MyAnimeList API, and includes anime titles, synopses, cover images, scores, ranks, types, episode counts, and source URLs. Jikan is used only during database seeding; normal app usage reads from MongoDB.

## Tech Stack

- Frontend: React, Vite, Motion for React
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Data source: Jikan API / MyAnimeList metadata

## Run MongoDB Locally

```bash
docker run --name animeswipe-mongo \
  -p 27017:27017 \
  -v animeswipe-mongo-data:/data/db \
  -d mongo:7
```

If the container already exists:

```bash
docker start animeswipe-mongo
```

## Backend Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

The backend defaults to:

```txt
http://localhost:4000
```

Required environment variable:

```txt
MONGODB_URI=mongodb://localhost:27017/animeswipe
```

## Seed The Database

Seed anime items from Jikan:

```bash
cd server
npm run seed
```

Seed a demo user named `end` who has voted on every anime item:

```bash
cd server
npm run seed:end
```

The `end` user is useful for testing the end-of-deck screen.

Seed a group of demo users with varied voting histories:

```bash
cd server
npm run seed:votes
```

By default this creates 12 users named `demo_user_01` through `demo_user_12`. Set `DEMO_USER_COUNT` to choose a different number.

## Frontend Setup

From the repository root:

```bash
npm install
npm run dev
```

The frontend defaults to:

```txt
http://localhost:5173
```

If that port is busy, Vite may choose the next available port.

## API Summary

```txt
GET    /api/health
POST   /api/auth/login
GET    /api/items?userId=...
POST   /api/vote
DELETE /api/vote
GET    /api/results?sort=mostLoved|mostVoted|mostDivisive|alphabetical
GET    /api/matches?userId=...
```

Vote body:

```json
{
  "userId": "USER_ID",
  "itemId": 5114,
  "choice": "yes",
  "decisionMs": 850
}
```

Undo vote body:

```json
{
  "userId": "USER_ID",
  "itemId": 5114
}
```

## Architecture

AniSwipe is split into a Vite React frontend and an Express backend. The frontend handles username login, card voting, undo, results, matches, and mobile interactions. It talks only to the backend API at `http://localhost:4000/api`.

The backend owns persistence and validation. It connects to MongoDB through Mongoose models for users, anime items, votes, and swipe events. A seed script fetches anime from Jikan and stores normalized records in MongoDB, after which the app uses MongoDB as the source of truth.

## Persistence

MongoDB stores all users, anime items, votes, and swipe analytics. Items are seeded with a stable numeric `itemId` from MyAnimeList. Votes reference MongoDB user and item documents, so aggregate results and matches survive page refreshes and server restarts.

## Vote Deduplication

Votes are tied to both `userId` and `itemId`. The `Vote` model defines a MongoDB unique compound index on:

```js
{ userId: 1, itemId: 1 }
```

`POST /api/vote` uses an upsert, so repeated votes by the same user on the same anime update the existing vote instead of creating duplicates. This prevents double-counting in aggregate results.

## Completed Core Requirements

- React + Vite mobile-first frontend
- Node.js + Express backend
- MongoDB persistence with Mongoose
- Lightweight username login
- Anime seed script using Jikan
- 100+ seeded anime items
- Vote yes/no flow
- Persistent aggregate results
- Matches endpoint and view
- Unique vote deduplication per user and anime
- Backend health endpoint

## Completed Stretch Requirements

- Drag/swipe gestures with click buttons as fallback
- Swipe hints and card exit/fade transitions
- Undo last swipe with `DELETE /api/vote`
- Expandable descriptions/details
- Results sorting and polling
- Demo `end` user seed for end-of-deck testing
- Demo population vote seed for richer aggregate results
- Mobile UI polish for a 390x844 viewport
- Broken image fallback handling

## Known Issues

- This is demo authentication only; usernames are not password protected.
- Jikan seeding depends on network availability and Jikan rate limits.
- The recommendation logic is intentionally simple.
- Results polling is basic and not optimized for large datasets.
- Image URLs come from external sources, so some covers may fail over time.

## Data Credit

Anime metadata and images are fetched from the [Jikan API](https://jikan.moe/), an unofficial API for [MyAnimeList](https://myanimelist.net/). AniSwipe stores seeded data locally in MongoDB and does not call Jikan during normal demo use.

The app background uses [“Anime City” by Hay Lyo](https://www.publicdomainpictures.net/en/view-image.php?image=511609&picture=anime-city), released as CC0/Public Domain on PublicDomainPictures.
