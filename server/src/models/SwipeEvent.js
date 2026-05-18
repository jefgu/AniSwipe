import mongoose from "mongoose";

const swipeEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["vote"],
      default: "vote",
    },
    choice: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
    decisionMs: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

export default mongoose.models.SwipeEvent ||
  mongoose.model("SwipeEvent", swipeEventSchema);
