import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import connectDB from "./src/db.js";
import analyticsRoutes from "./src/routes/analytics.js";
import authRoutes from "./src/routes/auth.js";
import itemRoutes from "./src/routes/items.js";
import matchRoutes from "./src/routes/matches.js";
import resultRoutes from "./src/routes/results.js";
import voteRoutes from "./src/routes/votes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "AniSwipe API",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AniSwipe API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
