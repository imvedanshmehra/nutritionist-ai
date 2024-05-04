import mongoose from "mongoose";

import { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    tgId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose?.model("Event", eventSchema);
