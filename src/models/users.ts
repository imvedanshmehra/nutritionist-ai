import mongoose from "mongoose";

import { Schema } from "mongoose";

const userSchema = new Schema(
  {
    tgId: {
      type: String,
      required: true,
      unique: true,
    },
    chatId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    isBot: {
      type: Boolean,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose?.model("User", userSchema);
