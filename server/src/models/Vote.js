import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
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
  { timestamps: true }
);

voteSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model("Vote", voteSchema);
