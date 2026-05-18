import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    sourceUrl: {
      type: String,
      default: "",
    },
    rank: {
      type: Number,
      default: null,
    },
    score: {
      type: Number,
      default: null,
    },
    type: {
      type: String,
      default: "",
    },
    episodes: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

itemSchema.index({ title: 1 });
itemSchema.index({ rank: 1 });

export default mongoose.models.Item || mongoose.model("Item", itemSchema);
